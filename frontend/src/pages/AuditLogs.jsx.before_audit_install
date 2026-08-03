import {useEffect,useState} from "react";
import {Refresh,Security} from "@mui/icons-material";
import {Alert,Box,Button,Chip,CircularProgress,Grid,MenuItem,Pagination,Paper,Stack,Table,TableBody,TableCell,TableContainer,TableHead,TableRow,TextField,Typography} from "@mui/material";
import {AuditAPI} from "../api/audit";
const colors={LOGIN:"success",LOGOUT:"default",CREATE:"primary",UPDATE:"warning",DELETE:"error"};
export default function AuditLogs(){
 const [rows,setRows]=useState([]),[count,setCount]=useState(0),[page,setPage]=useState(1),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const [filters,setFilters]=useState({search:"",action:"",username:"",date_from:"",date_to:""});
 const load=async()=>{setLoading(true);setError("");try{const r=await AuditAPI.getLogs({page,page_size:25,ordering:"-created_at",...Object.fromEntries(Object.entries(filters).filter(([,v])=>v))});setRows(Array.isArray(r.data)?r.data:r.data.results||[]);setCount(Array.isArray(r.data)?r.data.length:r.data.count||0)}catch(e){setError(e?.response?.data?.detail||"Unable to load audit logs.")}finally{setLoading(false)}};
 useEffect(()=>{load()},[page]);
 const change=(k,v)=>{setPage(1);setFilters(x=>({...x,[k]:v}))};
 return <Box sx={{pb:5}}><Stack spacing={3}>
  <Stack direction={{xs:"column",md:"row"}} spacing={2} sx={{justifyContent:"space-between",alignItems:{xs:"stretch",md:"center"}}}><Box><Typography variant="h4" fontWeight={900} color="#0B2A78">Audit Trail</Typography><Typography color="text.secondary">System activity and accountability records.</Typography></Box><Button variant="outlined" startIcon={<Refresh/>} onClick={load}>Refresh</Button></Stack>
  {error&&<Alert severity="error">{error}</Alert>}
  <Paper variant="outlined" sx={{p:2,borderRadius:3}}><Grid container spacing={2}>
   <Grid size={{xs:12,md:3}}><TextField fullWidth size="small" label="Search" value={filters.search} onChange={e=>change("search",e.target.value)}/></Grid>
   <Grid size={{xs:12,md:2}}><TextField select fullWidth size="small" label="Action" value={filters.action} onChange={e=>change("action",e.target.value)}><MenuItem value="">All</MenuItem>{["LOGIN","LOGOUT","CREATE","UPDATE","DELETE"].map(x=><MenuItem key={x} value={x}>{x}</MenuItem>)}</TextField></Grid>
   <Grid size={{xs:12,md:2}}><TextField fullWidth size="small" label="Username" value={filters.username} onChange={e=>change("username",e.target.value)}/></Grid>
   <Grid size={{xs:12,md:2}}><TextField fullWidth size="small" type="date" label="From" value={filters.date_from} slotProps={{inputLabel:{shrink:true}}} onChange={e=>change("date_from",e.target.value)}/></Grid>
   <Grid size={{xs:12,md:2}}><TextField fullWidth size="small" type="date" label="To" value={filters.date_to} slotProps={{inputLabel:{shrink:true}}} onChange={e=>change("date_to",e.target.value)}/></Grid>
   <Grid size={{xs:12,md:1}}><Button fullWidth variant="contained" onClick={load}>Apply</Button></Grid>
  </Grid></Paper>
  <Paper variant="outlined" sx={{borderRadius:3,overflow:"hidden"}}>{loading?<Box sx={{py:8,display:"grid",placeItems:"center"}}><CircularProgress/></Box>:<TableContainer><Table size="small"><TableHead><TableRow sx={{"& th":{bgcolor:"#0B2A78",color:"white",fontWeight:800}}}><TableCell>Date</TableCell><TableCell>User</TableCell><TableCell>Action</TableCell><TableCell>Model</TableCell><TableCell>Object ID</TableCell><TableCell>IP</TableCell></TableRow></TableHead><TableBody>{rows.map(r=><TableRow key={r.id} hover><TableCell>{new Date(r.created_at).toLocaleString()}</TableCell><TableCell>{r.user_full_name||r.username||"System"}</TableCell><TableCell><Chip size="small" label={r.action} color={colors[r.action]||"default"}/></TableCell><TableCell>{r.model_name}</TableCell><TableCell>{r.object_id||"—"}</TableCell><TableCell>{r.ip_address||"—"}</TableCell></TableRow>)}{!rows.length&&<TableRow><TableCell colSpan={6} align="center" sx={{py:5}}><Security sx={{fontSize:40,color:"text.secondary"}}/><Typography color="text.secondary">No audit records found.</Typography></TableCell></TableRow>}</TableBody></Table></TableContainer>}</Paper>
  {count>25&&<Stack direction="row" sx={{justifyContent:"center"}}><Pagination page={page} count={Math.ceil(count/25)} onChange={(e,v)=>setPage(v)} color="primary"/></Stack>}
 </Stack></Box>
}
