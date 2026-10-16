from pathlib import Path
import html,json,re
from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph
root=Path('/workspace/sites/atm-service-review/dist')
sql=(root/'files/ATM_Dispute_Analysis_SQLite.sql').read_text()
view=sql.split('CREATE VIEW service_metrics AS',1)[1].split('-- Q1.',1)[0]
view='CREATE VIEW service_metrics AS'+view
view=view.replace("limitday.calendar_date || ' 17:00:00'","limitday.calendar_date || printf(' %02d:%02d:00', CAST(s.close_min/60 AS INTEGER),s.close_min%60)")
view=view.replace('a.csat_score<=2','a.csat_score<=s.low_rating_threshold')
(root/'assets/view.sql').write_text(view)
queries=[]
for section in re.split(r'(?m)^-- Q',sql)[1:]:
 title,body=section.split('\n',1)
 queries.append({'id':'Q'+title.split('.')[0],'title':title.split('. ',1)[1],'sql':body.strip()})
(root/'assets/queries.json').write_text(json.dumps(queries))
d=Document(root/'files/ATM_Dispute_DA_Case_Study.docx');parts=[]
for child in d.element.body:
 if child.tag.endswith('}p'):
  p=Paragraph(child,d);text=p.text.strip()
  if not text:continue
  tag='h2' if p.style.name=='Title' else 'h3' if p.style.name=='Heading 1' else 'h4' if p.style.name=='Heading 2' else 'p'
  parts.append(f'<{tag}>{html.escape(text)}</{tag}>')
 elif child.tag.endswith('}tbl'):
  t=Table(child,d);parts.append('<div class="table-scroll"><table class="report-table">')
  for i,row in enumerate(t.rows):
   tag='th' if i==0 else 'td';parts.append('<tr>'+''.join(f'<{tag}>{html.escape(c.text)}</{tag}>' for c in row.cells)+'</tr>')
  parts.append('</table></div>')
(root/'assets/report.html').write_text('\n'.join(parts))
(root.parent/'.openai/hosting.json').write_text(json.dumps({'project_id':'appgprj_6ad2707f3ac08191b5946bd0c16875c5','static':{'directory':'dist'}}))
