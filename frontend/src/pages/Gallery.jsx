import { Box, Grid, Paper, Typography } from "@mui/material";
const photos = [
  ["/atdmf-science.jpeg", "Science and practical learning"],
  ["/atdmf-graduation.jpeg", "Student achievement and graduation"],
  ["/atdmf-community.jpeg", "School community and leadership"],
  ["/atdmf-students.jpeg", "Student life at ATDMA"],
];
export default function Gallery() {
  return <Box><Typography variant="h4" fontWeight={900} color="#0B2A78" mb={1}>School Gallery</Typography><Typography color="text.secondary" mb={3}>Official photographs from Annie T. Doe Memorial Academy.</Typography><Grid container spacing={3}>{photos.map(([src,title])=><Grid key={src} size={{xs:12,sm:6}}><Paper sx={{overflow:"hidden",borderRadius:3}}><Box component="img" src={src} alt={title} sx={{width:"100%",height:{xs:260,md:360},objectFit:"cover",display:"block"}}/><Typography fontWeight={800} p={2}>{title}</Typography></Paper></Grid>)}</Grid></Box>;
}
