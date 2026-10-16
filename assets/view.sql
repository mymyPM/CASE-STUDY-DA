CREATE VIEW service_metrics AS
SELECT a.*,substr(a.received_at,1,7) AS received_month,
 (cd.workday_index-cc.workday_index)*(s.close_min-s.open_min)+(CAST(strftime('%H',a.first_response_at) AS INTEGER)*60+CAST(strftime('%M',a.first_response_at) AS INTEGER))-(CAST(strftime('%H',a.received_at) AS INTEGER)*60+CAST(strftime('%M',a.received_at) AS INTEGER)) AS response_work_minutes,
 CASE WHEN (cd.workday_index-cc.workday_index)*(s.close_min-s.open_min)+(CAST(strftime('%H',a.first_response_at) AS INTEGER)*60+CAST(strftime('%M',a.first_response_at) AS INTEGER))-(CAST(strftime('%H',a.received_at) AS INTEGER)*60+CAST(strftime('%M',a.received_at) AS INTEGER))<=s.response_target_min THEN 1 ELSE 0 END AS response_target_met,
 ce.workday_index-cc.workday_index AS verification_workdays,
 ROUND((julianday(a.refunded_at)-julianday(a.received_at))*24,2) AS customer_wait_hours,
 (cf.workday_index-ce.workday_index)*(s.close_min-s.open_min)+(CAST(strftime('%H',a.refunded_at) AS INTEGER)*60+CAST(strftime('%M',a.refunded_at) AS INTEGER))-(CAST(strftime('%H',a.verified_at) AS INTEGER)*60+CAST(strftime('%M',a.verified_at) AS INTEGER)) AS accounting_wait_work_minutes,
 CASE WHEN date(a.received_at)=date(a.refunded_at) THEN 1 ELSE 0 END AS same_day_refund,
 limitday.calendar_date || printf(' %02d:%02d:00', CAST(s.close_min/60 AS INTEGER),s.close_min%60) AS sla_deadline,
 CASE WHEN a.refunded_at<=limitday.calendar_date || printf(' %02d:%02d:00', CAST(s.close_min/60 AS INTEGER),s.close_min%60) THEN 1 ELSE 0 END AS within_sla,
 CASE WHEN a.csat_score IS NOT NULL AND a.csat_score<=s.low_rating_threshold THEN 1 ELSE 0 END AS low_rating
FROM cases a CROSS JOIN settings s
JOIN work_calendar cc ON cc.calendar_date=date(a.received_at)
JOIN work_calendar cd ON cd.calendar_date=date(a.first_response_at)
JOIN work_calendar ce ON ce.calendar_date=date(a.verified_at)
JOIN work_calendar cf ON cf.calendar_date=date(a.refunded_at)
JOIN work_calendar limitday ON limitday.is_workday=1 AND limitday.workday_index=cc.workday_index+s.sla_days;

