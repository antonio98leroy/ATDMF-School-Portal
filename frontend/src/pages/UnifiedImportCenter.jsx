import { Assessment, Groups, Payments, School } from "@mui/icons-material";
import { Box, Grid, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
const items=[
 ["Students, Guardians & Sponsors","Student, guardian, enrollment and sponsorship workbook.","/import-center",<School/>],
 ["Academic Results","Historical marksheets, assessments and semester results.","/academic-import",<Assessment/>],
 ["Staff & Employees","Upload staff through the Import Center employee option.","/import-center",<Groups/>],
 ["Finance & Bank Statements","Payments and weekly bank statements are managed in Finance.","/finance",<Payments/>],
];
export default function UnifiedImportCenter(){const nav=useNavigate();return <Box><Typography variant="h4" fontWeight={900} color="#0B2A78">Unified Import Center</Typography><Typography color="text.secondary" mb={3}>Select the records you want to import or manage.</Typography><Grid container spacing={3}>{items.map(([t,d,p,i])=><Grid key={t} size={{xs:12,sm:6}}><Paper onClick={()=>nav(p)} sx={{p:3,borderRadius:3,cursor:"pointer",height:"100%","&:hover":{boxShadow:5,transform:"translateY(-2px)"}}}><Stack direction="row" spacing={2}><Box sx={{color:"#0B2A78"}}>{i}</Box><Box><Typography variant="h6" fontWeight={900}>{t}</Typography><Typography color="text.secondary">{d}</Typography></Box></Stack></Paper></Grid>)}</Grid></Box>}
