import { useEffect, useState } from "react";
import {
  Add, Archive, Campaign, Delete, Description, Email, Inbox,
  MarkEmailRead, Publish, Refresh, Restore, Send
} from "@mui/icons-material";
import {
  Alert, Autocomplete, Box, Button, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, Divider, FormControl,
  Grid, IconButton, InputLabel, MenuItem, Paper, Select, Snackbar,
  Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Tabs, TextField, Typography
} from "@mui/material";
import { CommunicationsAPI } from "../api/communications";

const normalizeList = (r) => Array.isArray(r?.data) ? r.data : (r?.data?.results || []);
const errorText = (e) => e?.response?.data?.detail || "Unable to complete request.";
const fmt = (v) => v ? new Date(v).toLocaleString() : "—";
const priorityColor = { LOW:"default", NORMAL:"info", HIGH:"warning", URGENT:"error" };
const statusColor = { DRAFT:"default", SCHEDULED:"info", PUBLISHED:"success", ARCHIVED:"secondary" };

export default function Notices() {
  const [tab,setTab]=useState(0);
  const [summary,setSummary]=useState({});
  const [notices,setNotices]=useState([]);
  const [messages,setMessages]=useState([]);
  const [documents,setDocuments]=useState([]);
  const [users,setUsers]=useState([]);
  const [box,setBox]=useState("inbox");
  const [loading,setLoading]=useState(true);
  const [noticeOpen,setNoticeOpen]=useState(false);
  const [messageOpen,setMessageOpen]=useState(false);
  const [documentOpen,setDocumentOpen]=useState(false);
  const [viewNotice,setViewNotice]=useState(null);
  const [viewMessage,setViewMessage]=useState(null);
  const [snack,setSnack]=useState({open:false,message:"",severity:"success"});

  const show=(message,severity="success")=>setSnack({open:true,message,severity});

  const loadAll=async()=>{
    setLoading(true);
    try{
      const [s,n,m,d,u]=await Promise.all([
        CommunicationsAPI.getSummary(),
        CommunicationsAPI.getNotices({page_size:1000,ordering:"-pinned,-created_at"}),
        CommunicationsAPI.getMessages({box,page_size:1000,ordering:"-created_at"}),
        CommunicationsAPI.getDocuments({page_size:1000,ordering:"-uploaded_at"}),
        CommunicationsAPI.getUsers({page_size:1000}),
      ]);
      setSummary(s.data||{});
      setNotices(normalizeList(n));
      setMessages(normalizeList(m));
      setDocuments(normalizeList(d));
      setUsers(normalizeList(u));
    }catch(e){show(errorText(e),"error");}
    finally{setLoading(false);}
  };

  useEffect(()=>{loadAll();},[box]);

  if(loading) return <Box sx={{minHeight:"60vh",display:"grid",placeItems:"center"}}><CircularProgress/></Box>;

  return <Box sx={{pb:5}}>
    <Stack spacing={3}>
      <Stack direction={{xs:"column",md:"row"}} spacing={2} sx={{justifyContent:"space-between",alignItems:{md:"center"}}}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="#0B2A78">Communications</Typography>
          <Typography color="text.secondary">Notices, internal messages, and shared documents.</Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh/>} onClick={loadAll}>Refresh</Button>
      </Stack>

      <Grid container spacing={2}>
        {[
          ["Active Notices",summary.active_notices||0,<Campaign/>],
          ["Unread Notices",summary.unread_notices||0,<MarkEmailRead/>],
          ["Inbox Messages",summary.inbox_messages||0,<Inbox/>],
          ["Unread Messages",summary.unread_messages||0,<Email/>],
          ["Documents",summary.documents||0,<Description/>],
        ].map(([title,value,icon])=><Grid key={title} size={{xs:12,sm:6,lg:2.4}}>
          <Paper variant="outlined" sx={{p:2,borderRadius:3}}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{width:44,height:44,borderRadius:2,display:"grid",placeItems:"center",bgcolor:"#E8EEFF",color:"#0B2A78"}}>{icon}</Box>
              <Box><Typography variant="caption" color="text.secondary">{title}</Typography><Typography variant="h6" fontWeight={900}>{value}</Typography></Box>
            </Stack>
          </Paper>
        </Grid>)}
      </Grid>

      <Tabs value={tab} onChange={(_,v)=>setTab(v)} variant="scrollable" scrollButtons="auto">
        <Tab label="Notices"/><Tab label="Messages"/><Tab label="Documents"/>
      </Tabs>

      {tab===0 && <Stack spacing={2}>
        <Stack direction={{xs:"column",sm:"row"}} spacing={1} sx={{justifyContent:"space-between"}}>
          <Box><Typography variant="h6" fontWeight={800} color="#0B2A78">School Notices</Typography><Typography color="text.secondary">Create, publish, archive, and track announcements.</Typography></Box>
          <Button variant="contained" startIcon={<Add/>} onClick={()=>setNoticeOpen(true)} sx={{bgcolor:"#0B2A78"}}>New Notice</Button>
        </Stack>
        <Paper variant="outlined" sx={{borderRadius:3,overflow:"hidden"}}>
          <TableContainer><Table><TableHead><Header><TableCell>Title</TableCell><TableCell>Audience</TableCell><TableCell>Priority</TableCell><TableCell>Status</TableCell><TableCell>Reads</TableCell><TableCell>Actions</TableCell></Header></TableHead>
          <TableBody>{notices.map(n=><TableRow key={n.id} hover onClick={()=>setViewNotice(n)} sx={{cursor:"pointer"}}>
            <TableCell><Typography fontWeight={800}>{n.title}</Typography><Typography variant="caption" color="text.secondary">By {n.created_by_name||"Unknown"} · {fmt(n.created_at)}</Typography></TableCell>
            <TableCell>{n.audience_display||n.audience}</TableCell>
            <TableCell><Chip size="small" label={n.priority_display||n.priority} color={priorityColor[n.priority]||"default"}/></TableCell>
            <TableCell><Chip size="small" label={n.status_display||n.status} color={statusColor[n.status]||"default"}/></TableCell>
            <TableCell>{n.read_count||0}</TableCell>
            <TableCell onClick={e=>e.stopPropagation()}>
              {n.status!=="PUBLISHED" && <IconButton color="success" onClick={async()=>{await CommunicationsAPI.publishNotice(n.id);show("Notice published.");loadAll();}}><Publish/></IconButton>}
              {n.status!=="ARCHIVED" && <IconButton onClick={async()=>{await CommunicationsAPI.archiveNotice(n.id);show("Notice archived.");loadAll();}}><Archive/></IconButton>}
              <IconButton color="error" onClick={async()=>{if(window.confirm(`Delete "${n.title}"?`)){await CommunicationsAPI.deleteNotice(n.id);show("Notice deleted.");loadAll();}}}><Delete/></IconButton>
            </TableCell>
          </TableRow>)}
          {notices.length===0 && <Empty colSpan={6} text="No notices found."/>}</TableBody></Table></TableContainer>
        </Paper>
      </Stack>}

      {tab===1 && <Stack spacing={2}>
        <Stack direction={{xs:"column",sm:"row"}} spacing={1} sx={{justifyContent:"space-between"}}>
          <FormControl size="small" sx={{minWidth:180}}><InputLabel>Mailbox</InputLabel><Select label="Mailbox" value={box} onChange={e=>setBox(e.target.value)}><MenuItem value="inbox">Inbox</MenuItem><MenuItem value="sent">Sent</MenuItem><MenuItem value="archived">Archived</MenuItem></Select></FormControl>
          <Button variant="contained" startIcon={<Send/>} onClick={()=>setMessageOpen(true)} sx={{bgcolor:"#0B2A78"}}>Compose</Button>
        </Stack>
        <Paper variant="outlined" sx={{borderRadius:3,overflow:"hidden"}}>
          <TableContainer><Table><TableHead><Header><TableCell>Subject</TableCell><TableCell>Sender</TableCell><TableCell>Priority</TableCell><TableCell>Date</TableCell><TableCell>Status</TableCell><TableCell>Action</TableCell></Header></TableHead>
          <TableBody>{messages.map(m=><TableRow key={m.id} hover onClick={async()=>{setViewMessage(m);if(m.current_recipient_status && !m.current_recipient_status.read){await CommunicationsAPI.markMessageRead(m.id);loadAll();}}} sx={{cursor:"pointer",bgcolor:m.current_recipient_status&&!m.current_recipient_status.read?"#F3F6FF":"inherit"}}>
            <TableCell><Typography fontWeight={m.current_recipient_status&&!m.current_recipient_status.read?900:700}>{m.subject}</Typography></TableCell>
            <TableCell>{m.sender_name}</TableCell>
            <TableCell><Chip size="small" label={m.priority_display||m.priority} color={priorityColor[m.priority]||"default"}/></TableCell>
            <TableCell>{fmt(m.created_at)}</TableCell>
            <TableCell>{box==="sent"?<Chip size="small" label="Sent" color="success"/>:<Chip size="small" label={m.current_recipient_status?.read?"Read":"Unread"} color={m.current_recipient_status?.read?"default":"primary"}/>}</TableCell>
            <TableCell onClick={e=>e.stopPropagation()}>{box==="archived"?<IconButton onClick={async()=>{await CommunicationsAPI.restoreMessage(m.id);show("Message restored.");loadAll();}}><Restore/></IconButton>:box!=="sent"&&<IconButton onClick={async()=>{await CommunicationsAPI.archiveMessage(m.id);show("Message archived.");loadAll();}}><Archive/></IconButton>}</TableCell>
          </TableRow>)}
          {messages.length===0 && <Empty colSpan={6} text="No messages found."/>}</TableBody></Table></TableContainer>
        </Paper>
      </Stack>}

      {tab===2 && <Stack spacing={2}>
        <Stack direction={{xs:"column",sm:"row"}} spacing={1} sx={{justifyContent:"space-between"}}>
          <Box><Typography variant="h6" fontWeight={800} color="#0B2A78">Shared Documents</Typography><Typography color="text.secondary">Policies, circulars, forms, and reports.</Typography></Box>
          <Button variant="contained" startIcon={<Add/>} onClick={()=>setDocumentOpen(true)} sx={{bgcolor:"#0B2A78"}}>Upload Document</Button>
        </Stack>
        <Paper variant="outlined" sx={{borderRadius:3,overflow:"hidden"}}>
          <TableContainer><Table><TableHead><Header><TableCell>Title</TableCell><TableCell>Category</TableCell><TableCell>Audience</TableCell><TableCell>Uploaded By</TableCell><TableCell>Date</TableCell><TableCell>File</TableCell><TableCell>Action</TableCell></Header></TableHead>
          <TableBody>{documents.map(d=><TableRow key={d.id} hover>
            <TableCell><Typography fontWeight={800}>{d.title}</Typography><Typography variant="caption" color="text.secondary">{d.description}</Typography></TableCell>
            <TableCell>{d.category}</TableCell><TableCell>{d.audience_display||d.audience}</TableCell><TableCell>{d.uploaded_by_name||"—"}</TableCell><TableCell>{fmt(d.uploaded_at)}</TableCell>
            <TableCell><Button component="a" href={d.file} target="_blank" rel="noreferrer" size="small">Open</Button></TableCell>
            <TableCell><IconButton color="error" onClick={async()=>{if(window.confirm(`Delete "${d.title}"?`)){await CommunicationsAPI.deleteDocument(d.id);show("Document deleted.");loadAll();}}}><Delete/></IconButton></TableCell>
          </TableRow>)}
          {documents.length===0 && <Empty colSpan={7} text="No documents found."/>}</TableBody></Table></TableContainer>
        </Paper>
      </Stack>}
    </Stack>

    <NoticeDialog open={noticeOpen} onClose={()=>setNoticeOpen(false)} onSaved={()=>{setNoticeOpen(false);show("Notice saved.");loadAll();}} show={show}/>
    <MessageDialog open={messageOpen} onClose={()=>setMessageOpen(false)} users={users} onSaved={()=>{setMessageOpen(false);setBox("sent");show("Message sent.");loadAll();}} show={show}/>
    <DocumentDialog open={documentOpen} onClose={()=>setDocumentOpen(false)} onSaved={()=>{setDocumentOpen(false);show("Document uploaded.");loadAll();}} show={show}/>

    <Dialog open={Boolean(viewNotice)} onClose={()=>setViewNotice(null)} fullWidth maxWidth="md">
      {viewNotice&&<><DialogTitle><Typography variant="h6" fontWeight={900} color="#0B2A78">{viewNotice.title}</Typography></DialogTitle><Divider/><DialogContent><Stack direction="row" spacing={1} mb={2}><Chip label={viewNotice.audience_display||viewNotice.audience}/><Chip label={viewNotice.priority_display||viewNotice.priority} color={priorityColor[viewNotice.priority]||"default"}/></Stack><Typography sx={{whiteSpace:"pre-wrap",lineHeight:1.75}}>{viewNotice.body}</Typography></DialogContent><DialogActions><Button onClick={()=>setViewNotice(null)}>Close</Button></DialogActions></>}
    </Dialog>

    <Dialog open={Boolean(viewMessage)} onClose={()=>setViewMessage(null)} fullWidth maxWidth="md">
      {viewMessage&&<><DialogTitle><Typography variant="h6" fontWeight={900} color="#0B2A78">{viewMessage.subject}</Typography></DialogTitle><Divider/><DialogContent><Typography variant="body2" color="text.secondary" mb={2}>From {viewMessage.sender_name} · {fmt(viewMessage.created_at)}</Typography><Typography sx={{whiteSpace:"pre-wrap",lineHeight:1.75}}>{viewMessage.body}</Typography></DialogContent><DialogActions><Button onClick={()=>setViewMessage(null)}>Close</Button></DialogActions></>}
    </Dialog>

    <Snackbar open={snack.open} autoHideDuration={5000} onClose={()=>setSnack({...snack,open:false})}><Alert severity={snack.severity} variant="filled">{snack.message}</Alert></Snackbar>
  </Box>;
}

function NoticeDialog({open,onClose,onSaved,show}){
  const [form,setForm]=useState({title:"",body:"",audience:"ALL",priority:"NORMAL",status:"DRAFT",publish_at:"",expires_at:"",pinned:false});
  const [saving,setSaving]=useState(false);
  const save=async()=>{if(!form.title.trim()||!form.body.trim())return show("Title and body are required.","warning");setSaving(true);try{await CommunicationsAPI.createNotice({...form,publish_at:form.publish_at||null,expires_at:form.expires_at||null});onSaved();}catch(e){show(errorText(e),"error");}finally{setSaving(false);}};
  return <FormDialog open={open} onClose={onClose} title="Create School Notice" saving={saving} onSave={save} maxWidth="md">
    <Grid container spacing={2}>
      <Grid size={12}><TextField fullWidth required label="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></Grid>
      <Grid size={12}><TextField fullWidth required multiline minRows={6} label="Message" value={form.body} onChange={e=>setForm({...form,body:e.target.value})}/></Grid>
      <Grid size={{xs:12,md:4}}><TextField select fullWidth label="Audience" value={form.audience} onChange={e=>setForm({...form,audience:e.target.value})}>{[["ALL","Everyone"],["STAFF","All Staff"],["TEACHERS","Teachers"],["STUDENTS","Students"],["PARENTS","Parents"],["REGISTRAR","Registrar"],["FINANCE","Finance Staff"],["PRINCIPAL","Principal/Admin"]].map(([v,l])=><MenuItem key={v} value={v}>{l}</MenuItem>)}</TextField></Grid>
      <Grid size={{xs:12,md:4}}><TextField select fullWidth label="Priority" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>{["LOW","NORMAL","HIGH","URGENT"].map(v=><MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField></Grid>
      <Grid size={{xs:12,md:4}}><TextField select fullWidth label="Status" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><MenuItem value="DRAFT">Draft</MenuItem><MenuItem value="SCHEDULED">Scheduled</MenuItem><MenuItem value="PUBLISHED">Publish Now</MenuItem></TextField></Grid>
      <Grid size={{xs:12,md:6}}><TextField fullWidth type="datetime-local" label="Publish date" slotProps={{inputLabel:{shrink:true}}} value={form.publish_at} onChange={e=>setForm({...form,publish_at:e.target.value})}/></Grid>
      <Grid size={{xs:12,md:6}}><TextField fullWidth type="datetime-local" label="Expiry date" slotProps={{inputLabel:{shrink:true}}} value={form.expires_at} onChange={e=>setForm({...form,expires_at:e.target.value})}/></Grid>
    </Grid>
  </FormDialog>;
}

function MessageDialog({open,onClose,users,onSaved,show}){
  const [form,setForm]=useState({recipients:[],subject:"",body:"",priority:"NORMAL"});
  const [saving,setSaving]=useState(false);
  const save=async()=>{if(!form.recipients.length||!form.subject.trim()||!form.body.trim())return show("Recipients, subject, and body are required.","warning");setSaving(true);try{await CommunicationsAPI.createMessage({recipient_ids:form.recipients.map(x=>x.id),subject:form.subject,body:form.body,priority:form.priority});onSaved();}catch(e){show(errorText(e),"error");}finally{setSaving(false);}};
  return <FormDialog open={open} onClose={onClose} title="Compose Message" saving={saving} onSave={save} maxWidth="md">
    <Stack spacing={2}>
      <Autocomplete multiple options={users} value={form.recipients} isOptionEqualToValue={(a,b)=>a.id===b.id} getOptionLabel={o=>`${o.full_name||o.username}${o.role?` — ${o.role}`:""}`} onChange={(_,v)=>setForm({...form,recipients:v})} renderInput={p=><TextField {...p} label="Recipients" required/>}/>
      <TextField fullWidth required label="Subject" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}/>
      <TextField select fullWidth label="Priority" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>{["LOW","NORMAL","HIGH","URGENT"].map(v=><MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField>
      <TextField fullWidth required multiline minRows={7} label="Message" value={form.body} onChange={e=>setForm({...form,body:e.target.value})}/>
    </Stack>
  </FormDialog>;
}

function DocumentDialog({open,onClose,onSaved,show}){
  const [form,setForm]=useState({title:"",category:"",description:"",audience:"ALL",file:null});
  const [saving,setSaving]=useState(false);
  const save=async()=>{if(!form.title.trim()||!form.category.trim()||!form.file)return show("Title, category, and file are required.","warning");const fd=new FormData();Object.entries({title:form.title,category:form.category,description:form.description,audience:form.audience,active:"true"}).forEach(([k,v])=>fd.append(k,v));fd.append("file",form.file);setSaving(true);try{await CommunicationsAPI.createDocument(fd);onSaved();}catch(e){show(errorText(e),"error");}finally{setSaving(false);}};
  return <FormDialog open={open} onClose={onClose} title="Upload Document" saving={saving} onSave={save}>
    <Stack spacing={2}>
      <TextField fullWidth required label="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
      <TextField fullWidth required label="Category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/>
      <TextField select fullWidth label="Audience" value={form.audience} onChange={e=>setForm({...form,audience:e.target.value})}>{[["ALL","Everyone"],["STAFF","Staff"],["TEACHERS","Teachers"],["STUDENTS","Students"],["PARENTS","Parents"],["ADMINISTRATION","Administration"]].map(([v,l])=><MenuItem key={v} value={v}>{l}</MenuItem>)}</TextField>
      <TextField fullWidth multiline minRows={3} label="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
      <Button component="label" variant="outlined" fullWidth sx={{minHeight:56}}>{form.file?form.file.name:"Select File"}<input hidden type="file" onChange={e=>setForm({...form,file:e.target.files?.[0]||null})}/></Button>
    </Stack>
  </FormDialog>;
}

function FormDialog({open,onClose,title,children,saving,onSave,maxWidth="sm"}){
  return <Dialog open={open} onClose={saving?undefined:onClose} fullWidth maxWidth={maxWidth}><DialogTitle>{title}</DialogTitle><Divider/><DialogContent sx={{pt:3}}>{children}</DialogContent><DialogActions sx={{p:2}}><Button onClick={onClose} disabled={saving}>Cancel</Button><Button variant="contained" onClick={onSave} disabled={saving} sx={{bgcolor:"#0B2A78"}}>{saving?<CircularProgress size={22} color="inherit"/>:"Save"}</Button></DialogActions></Dialog>;
}

function Header({children}){return <TableRow sx={{"& th":{bgcolor:"#0B2A78",color:"white",fontWeight:800,whiteSpace:"nowrap"}}}>{children}</TableRow>;}
function Empty({colSpan,text}){return <TableRow><TableCell colSpan={colSpan} align="center" sx={{py:5}}><Typography color="text.secondary">{text}</Typography></TableCell></TableRow>;}