import { useState, useEffect, useCallback } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Chip, Avatar,
  LinearProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, ToggleButton, ToggleButtonGroup,
  Skeleton, Alert, IconButton, Tooltip, Stack, Divider,
} from "@mui/material";
import {
  TrendingUp, DirectionsCar, CheckCircle, Assignment,
  ShoppingCart, GpsFixed, WarningAmber, Refresh,
  LocalHospital, MedicalServices, PersonSearch,
  Speed, FiberManualRecord, Biotech, Inventory2,
  TrackChanges, EmojiEvents,
} from "@mui/icons-material";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const C = {
  blue  : "#1d4ed8",
  indigo: "#4338ca",
  teal  : "#0d9488",
  amber : "#d97706",
  rose  : "#e11d48",
  green : "#16a34a",
  purple: "#7c3aed",
  orange: "#ea580c",
  slate : "#64748b",
};
const PIE_COLORS = [C.blue, C.teal, C.amber, C.rose, C.purple, C.orange, C.green, C.indigo];
const STATUS_COLOR = { closed: C.green, force_closed: C.rose, started: C.amber };

const fmtDate = iso =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "-";

const StatCard = ({ icon, label, value, sub, color, loading, target, achieved }) => (
  <Card elevation={0} sx={{
    border: "1px solid #e2e8f0", borderRadius: 3, height: "100%",
    background: `linear-gradient(135deg, ${color}08 0%, #fff 70%)`,
    transition: "box-shadow .2s",
    "&:hover": { boxShadow: `0 4px 20px ${color}20` },
  }}>
    <CardContent sx={{ p: 2.5 }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Box flex={1}>
          {loading ? (
            <><Skeleton width={70} height={38} /><Skeleton width={110} height={18} /></>
          ) : (
            <>
              <Typography variant="h4" fontWeight={800} color={color} lineHeight={1}>
                {value}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5} fontWeight={500}>
                {label}
              </Typography>
              {sub && (
                <Typography variant="caption" color="text.disabled">{sub}</Typography>
              )}
              {target > 0 && (
                <Box mt={1}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(achieved || 0, 100)}
                    sx={{
                      height: 5, borderRadius: 3, bgcolor: `${color}20`,
                      "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 },
                    }}
                  />
                  <Typography variant="caption" color="text.disabled">
                    {achieved}% of {target} target
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>
        <Avatar sx={{ bgcolor: `${color}15`, color, width: 44, height: 44, ml: 1 }}>
          {icon}
        </Avatar>
      </Stack>
    </CardContent>
  </Card>
);

const SectionTitle = ({ children }) => (
  <Typography variant="subtitle1" fontWeight={700} color="text.primary" mb={1.5}
    sx={{ borderLeft: `3px solid #1d4ed8`, pl: 1.5, lineHeight: 1.3 }}>
    {children}
  </Typography>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Paper elevation={4} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #e2e8f0", minWidth: 150 }}>
      <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>{label}</Typography>
      {payload.map(p => (
        <Stack key={p.dataKey} direction="row" alignItems="center" spacing={0.8} mb={0.3}>
          <FiberManualRecord sx={{ fontSize: 10, color: p.color }} />
          <Typography variant="caption" color="text.secondary">{p.name}:</Typography>
          <Typography variant="caption" fontWeight={700}>{p.value}</Typography>
        </Stack>
      ))}
    </Paper>
  );
};

export default function WorkPerformance() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [period, setPeriod]     = useState("month");
  const [chartKey, setChartKey] = useState("jobs");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("agentToken");
      const res = await axios.get(`${API}/api/agent/work-performance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data.performance);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load performance data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const p = data
    ? period === "today" ? data.today
    : period === "week"  ? data.thisWeek
    : data.thisMonth
    : null;

  const target      = data?.thisMonth?.target      || {};
  const achievement = data?.thisMonth?.achievement || {};
  const chartData   = (data?.dailyBreakdown || []).slice(-14);

  const partnerPie = data
    ? Object.entries(data.partnerBreakdown || {}).filter(([,v]) => v > 0)
        .map(([name, value]) => ({ name, value }))
    : [];

  const respPie = data
    ? Object.entries(data.responseBreakdown || {}).filter(([,v]) => v > 0)
        .map(([name, value]) => ({ name, value }))
    : [];

  const placeTypePie = data
    ? Object.entries(data.placeTypeBreakdown || {}).filter(([,v]) => v > 0)
        .map(([name, value]) => ({ name, value }))
    : [];

  const chartSeries = {
    jobs    : [{ key:"jobs",      name:"Total Jobs",  color:C.blue  },
               { key:"completed", name:"Completed",   color:C.green }],
    distance: [{ key:"distanceKm",        name:"Distance km",      color:C.teal   }],
    orders  : [{ key:"orders",            name:"Orders",            color:C.amber  }],
    products: [{ key:"productsDetailed",  name:"Products Detailed", color:C.purple }],
    samples : [{ key:"samplesGiven",      name:"Samples Given",     color:C.orange }],
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: "auto" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Work Performance</Typography>
          <Typography variant="body2" color="text.secondary">Real-time metrics from your field activity</Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <ToggleButtonGroup value={period} exclusive size="small" onChange={(_, v) => v && setPeriod(v)}
            sx={{ bgcolor:"#f1f5f9", borderRadius:2, "& .MuiToggleButton-root":{
              border:"none", borderRadius:"8px !important", px:1.5, fontSize:12, fontWeight:600,
              "&.Mui-selected":{ bgcolor:C.blue, color:"white" }
            }}}>
            <ToggleButton value="today">Today</ToggleButton>
            <ToggleButton value="week">This Week</ToggleButton>
            <ToggleButton value="month">This Month</ToggleButton>
          </ToggleButtonGroup>
          <Tooltip title="Refresh">
            <IconButton onClick={load} size="small" sx={{ bgcolor:"#f1f5f9" }}>
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}

      {data?.overview?.isGpsBlocked && (
        <Alert severity="error" icon={<WarningAmber />} sx={{ mb:2, borderRadius:2 }}>
          <strong>GPS Blocked</strong> — {data.overview.gpsViolations} violation(s). Contact admin.
        </Alert>
      )}
      {!data?.overview?.isGpsBlocked && (data?.overview?.gpsViolations || 0) > 0 && (
        <Alert severity="warning" sx={{ mb:2, borderRadius:2 }}>
          <strong>{data.overview.gpsViolations}</strong> GPS violation(s).{" "}
          {3 - data.overview.gpsViolations > 0 && `${3 - data.overview.gpsViolations} more will block your account.`}
        </Alert>
      )}

      <Grid container spacing={2} mb={3}>
        {[
          { icon:<Assignment />,  color:C.blue,   label:"Field Jobs",
            value: loading?"—": p?.jobs??0,
            sub: `${p?.completed??0} completed`,
            target: period==="month"?target.jobs:0, achieved:period==="month"?achievement.jobsRate:0 },
          { icon:<CheckCircle />, color:C.green,  label:"Completion Rate",
            value: loading?"—":`${p?.completionRate??0}%`,
            sub: `${p?.completed??0} closed of ${p?.jobs??0}` },
          { icon:<DirectionsCar />, color:C.teal, label:"Distance (km)",
            value: loading?"—": p?.distanceKm??0, sub:"Total traveled" },
          { icon:<PersonSearch />, color:C.indigo, label:"Doctors Covered",
            value: loading?"—": period==="month"?(achievement.doctorsCovered??0):"—",
            sub: period==="month"?`Target: ${target.doctors||"—"}`:"Month view only",
            target: period==="month"?target.doctors:0, achieved:period==="month"?achievement.doctorsRate:0 },
          { icon:<ShoppingCart />, color:C.amber,  label:"Orders Collected",
            value: loading?"—": p?.orders??0,
            sub: `${p?.responses??0} total responses`,
            target: period==="month"?target.orders:0, achieved:period==="month"?achievement.ordersRate:0 },
          { icon:<TrendingUp />,  color:C.purple, label:"Positive Responses",
            value: loading?"—": p?.positiveResp??0,
            sub: p?.responses?`${Math.round(((p.positiveResp||0)/p.responses)*100)}% rate`:"No data" },
          { icon:<Inventory2 />,  color:C.orange, label:"Products Detailed",
            value: loading?"—": p?.productsDetailed??0, sub:"Presentations given" },
          { icon:<Biotech />,     color:C.rose,   label:"Samples Given",
            value: loading?"—": p?.samplesGiven??0, sub:"Units distributed" },
        ].map((card,i) => (
          <Grid item xs={6} sm={4} md={3} key={i}>
            <StatCard {...card} loading={loading} />
          </Grid>
        ))}
      </Grid>

      {!loading && period==="month" && (
        <Card elevation={0} sx={{ border:"1px solid #e2e8f0", borderRadius:3, mb:3 }}>
          <CardContent sx={{ p:2.5 }}>
            <SectionTitle>Monthly Target vs Achievement</SectionTitle>
            <Grid container spacing={3}>
              {[
                { label:"Jobs",    done:p?.jobs??0,               target:target.jobs,    rate:achievement.jobsRate,    color:C.blue   },
                { label:"Doctors", done:achievement.doctorsCovered,target:target.doctors, rate:achievement.doctorsRate, color:C.indigo },
                { label:"Orders",  done:p?.orders??0,             target:target.orders,  rate:achievement.ordersRate,  color:C.amber  },
              ].map((item,i) => (
                <Grid item xs={12} sm={4} key={i}>
                  <Stack direction="row" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" fontWeight={600}>{item.label}</Typography>
                    <Typography variant="body2" fontWeight={700} color={item.color}>
                      {item.done??0} / {item.target||"—"}
                    </Typography>
                  </Stack>
                  <LinearProgress variant="determinate"
                    value={item.target>0?Math.min(item.rate||0,100):0}
                    sx={{ height:8, borderRadius:4, bgcolor:`${item.color}18`,
                      "& .MuiLinearProgress-bar":{
                        bgcolor:(item.rate||0)>=100?C.green:(item.rate||0)>=70?item.color:C.rose,
                        borderRadius:4 }}} />
                  <Typography variant="caption" color="text.disabled">
                    {item.target>0?`${item.rate||0}% achieved`:"No target set — contact admin"}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ border:"1px solid #e2e8f0", borderRadius:3 }}>
            <CardContent sx={{ p:2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
                <SectionTitle>14-Day Activity Trend</SectionTitle>
                <ToggleButtonGroup value={chartKey} exclusive size="small" onChange={(_,v)=>v&&setChartKey(v)}
                  sx={{ "& .MuiToggleButton-root":{ py:0.3, px:1, fontSize:11, fontWeight:600,
                    border:"1px solid #e2e8f0",
                    "&.Mui-selected":{ bgcolor:C.blue, color:"white", borderColor:C.blue }}}}>
                  <ToggleButton value="jobs">Jobs</ToggleButton>
                  <ToggleButton value="distance">KM</ToggleButton>
                  <ToggleButton value="orders">Orders</ToggleButton>
                  <ToggleButton value="products">Products</ToggleButton>
                  <ToggleButton value="samples">Samples</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
              {loading ? <Skeleton variant="rectangular" height={220} sx={{ borderRadius:2 }} /> :
                chartData.every(d => chartSeries[chartKey].every(s => !d[s.key])) ? (
                  <Box sx={{ height:220, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Typography variant="body2" color="text.disabled">No data for this period yet</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData} margin={{ top:5, right:10, left:-20, bottom:0 }}>
                      <defs>
                        {chartSeries[chartKey].map(s => (
                          <linearGradient key={s.key} id={`grad_${s.key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={s.color} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize:11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize:11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <RTooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12, paddingTop:8 }} />
                      {chartSeries[chartKey].map(s => (
                        <Area key={s.key} type="monotone" dataKey={s.key} name={s.name}
                          stroke={s.color} fill={`url(#grad_${s.key})`}
                          strokeWidth={2.5} dot={false} activeDot={{ r:5 }} />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                )
              }
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border:"1px solid #e2e8f0", borderRadius:3, height:"100%" }}>
            <CardContent sx={{ p:2.5 }}>
              <SectionTitle>Visit Type Breakdown</SectionTitle>
              {loading ? <Skeleton variant="circular" width={160} height={160} sx={{ mx:"auto", mt:2 }} /> :
                partnerPie.length===0 ? (
                  <Box sx={{ height:160, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Typography variant="body2" color="text.disabled">No visits recorded yet</Typography>
                  </Box>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={partnerPie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                          {partnerPie.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
                        </Pie>
                        <RTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <Stack spacing={0.7} mt={1}>
                      {partnerPie.map((item,i) => (
                        <Stack key={i} direction="row" alignItems="center" justifyContent="space-between">
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width:9, height:9, borderRadius:"50%", bgcolor:PIE_COLORS[i%PIE_COLORS.length] }} />
                            <Typography variant="caption" color="text.secondary">{item.name}</Typography>
                          </Stack>
                          <Chip label={item.value} size="small" sx={{ height:18, fontSize:11, fontWeight:700,
                            bgcolor:`${PIE_COLORS[i%PIE_COLORS.length]}15`, color:PIE_COLORS[i%PIE_COLORS.length] }} />
                        </Stack>
                      ))}
                    </Stack>
                  </>
                )
              }
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border:"1px solid #e2e8f0", borderRadius:3, height:"100%" }}>
            <CardContent sx={{ p:2.5 }}>
              <SectionTitle>Response Status</SectionTitle>
              {loading ? <Skeleton height={200} /> : respPie.length===0 ? (
                <Box sx={{ height:180, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Typography variant="body2" color="text.disabled">No responses yet</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={respPie} layout="vertical" margin={{ top:0, right:20, left:10, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize:11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize:10 }} tickLine={false} axisLine={false} width={140} />
                    <RTooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Count" radius={[0,4,4,0]} barSize={13}>
                      {respPie.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border:"1px solid #e2e8f0", borderRadius:3, height:"100%" }}>
            <CardContent sx={{ p:2.5 }}>
              <SectionTitle>Place Type Coverage</SectionTitle>
              {loading ? <Skeleton height={200} /> : placeTypePie.length===0 ? (
                <Box sx={{ height:180, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Typography variant="body2" color="text.disabled">No data yet</Typography>
                </Box>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={placeTypePie} cx="50%" cy="50%" outerRadius={65} paddingAngle={2} dataKey="value">
                        {placeTypePie.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
                      </Pie>
                      <RTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Stack spacing={0.6} mt={0.5}>
                    {placeTypePie.map((item,i) => (
                      <Stack key={i} direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={0.8}>
                          <Box sx={{ width:8, height:8, borderRadius:"50%", bgcolor:PIE_COLORS[i%PIE_COLORS.length] }} />
                          <Typography variant="caption" color="text.secondary">{item.name}</Typography>
                        </Stack>
                        <Typography variant="caption" fontWeight={700}>{item.value}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border:"1px solid #e2e8f0", borderRadius:3, height:"100%" }}>
            <CardContent sx={{ p:2.5 }}>
              <SectionTitle>Top Products Detailed</SectionTitle>
              {loading ? <Skeleton height={200} /> : (data?.topProducts||[]).length===0 ? (
                <Box sx={{ height:180, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Typography variant="body2" color="text.disabled">No products recorded yet</Typography>
                </Box>
              ) : (
                <Stack spacing={1} mt={0.5}>
                  {(data?.topProducts||[]).slice(0,6).map((item,i) => (
                    <Box key={i}>
                      <Stack direction="row" justifyContent="space-between" mb={0.3}>
                        <Typography variant="caption" fontWeight={600}
                          sx={{ maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" fontWeight={700} color={C.purple}>{item.count}x</Typography>
                      </Stack>
                      <LinearProgress variant="determinate"
                        value={(item.count/(data.topProducts[0]?.count||1))*100}
                        sx={{ height:5, borderRadius:3, bgcolor:`${C.purple}15`,
                          "& .MuiLinearProgress-bar":{ bgcolor:PIE_COLORS[i%PIE_COLORS.length], borderRadius:3 }}} />
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card elevation={0} sx={{ border:"1px solid #e2e8f0", borderRadius:3, mb:2.5 }}>
        <CardContent sx={{ p:2.5, pb:"16px !important" }}>
          <SectionTitle>Area-wise Performance</SectionTitle>
          {loading ? [...Array(4)].map((_,i)=><Skeleton key={i} height={44} sx={{ mb:0.5 }} />) : (
            <TableContainer sx={{ maxHeight:260 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {["Area","Jobs","Completed","Rate","Dist (km)","Doctors","Products","Samples"].map(h=>(
                      <TableCell key={h} sx={{ fontWeight:700, fontSize:12, bgcolor:"#f8fafc",
                        color:"text.secondary", py:1, borderBottom:"2px solid #e2e8f0", whiteSpace:"nowrap" }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data?.areaPerformance||[]).length===0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py:4, color:"text.disabled" }}>
                        No area data yet — complete a field job to see data here
                      </TableCell>
                    </TableRow>
                  ) : (data?.areaPerformance||[]).map((row,i)=>(
                    <TableRow key={i} hover sx={{ "&:last-child td":{ borderBottom:0 } }}>
                      <TableCell sx={{ fontWeight:600, fontSize:13 }}>{row.area}</TableCell>
                      <TableCell>{row.jobs}</TableCell>
                      <TableCell>
                        <Chip label={row.completed} size="small"
                          sx={{ bgcolor:`${C.green}15`, color:C.green, fontWeight:700, height:20, fontSize:11 }} />
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={12} fontWeight={700}
                          color={row.rate>=75?C.green:row.rate>=50?C.amber:C.rose}>{row.rate}%</Typography>
                      </TableCell>
                      <TableCell>{row.distanceKm}</TableCell>
                      <TableCell>{row.doctors}</TableCell>
                      <TableCell>{row.products}</TableCell>
                      <TableCell>{row.samples}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {!loading && (data?.sampleStockSummary||[]).length>0 && (
        <Card elevation={0} sx={{ border:"1px solid #e2e8f0", borderRadius:3, mb:2.5 }}>
          <CardContent sx={{ p:2.5, pb:"16px !important" }}>
            <SectionTitle>Sample Stock Balance</SectionTitle>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["Product","Opening Stock","Issued","Balance"].map(h=>(
                      <TableCell key={h} sx={{ fontWeight:700, fontSize:12, bgcolor:"#f8fafc",
                        color:"text.secondary", py:1, borderBottom:"2px solid #e2e8f0" }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.sampleStockSummary.map((s,i)=>(
                    <TableRow key={i} hover sx={{ "&:last-child td":{ borderBottom:0 } }}>
                      <TableCell sx={{ fontWeight:600 }}>{s.productName}</TableCell>
                      <TableCell>{s.openingStock}</TableCell>
                      <TableCell>{s.issued}</TableCell>
                      <TableCell>
                        <Chip label={s.balance} size="small" sx={{
                          bgcolor: s.balance<=5?`${C.rose}15`:`${C.green}15`,
                          color  : s.balance<=5?C.rose:C.green,
                          fontWeight:700, height:20, fontSize:11 }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      <Card elevation={0} sx={{ border:"1px solid #e2e8f0", borderRadius:3 }}>
        <CardContent sx={{ p:2.5, pb:"16px !important" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
            <SectionTitle>Recent Field Activity</SectionTitle>
            <Chip label="Last 10 jobs" size="small" sx={{ bgcolor:"#f1f5f9", fontSize:11, fontWeight:600 }} />
          </Stack>
          {loading ? [...Array(5)].map((_,i)=><Skeleton key={i} height={48} sx={{ mb:0.5 }} />) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["Date","Time","Area","Type","Doctor / Hospital","Products","Samples","Distance","Next Visit","Status"].map(h=>(
                      <TableCell key={h} sx={{ fontWeight:700, fontSize:12, bgcolor:"#f8fafc",
                        color:"text.secondary", py:1, borderBottom:"2px solid #e2e8f0", whiteSpace:"nowrap" }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data?.recentActivity||[]).length===0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py:4, color:"text.disabled" }}>
                        No recent activity. Start a job to see data here.
                      </TableCell>
                    </TableRow>
                  ) : (data?.recentActivity||[]).map((item,i)=>(
                    <TableRow key={i} hover sx={{ "&:last-child td":{ borderBottom:0 } }}>
                      <TableCell sx={{ fontSize:12, whiteSpace:"nowrap" }}>{fmtDate(item.date)}</TableCell>
                      <TableCell sx={{ fontSize:12 }}>{item.visitTime||"—"}</TableCell>
                      <TableCell sx={{ fontWeight:500, fontSize:13 }}>{item.area}</TableCell>
                      <TableCell>
                        {item.partner && item.partner!=="-" && (
                          <Chip
                            icon={item.partner==="Doctor"?<PersonSearch sx={{ fontSize:"13px !important" }} />:
                                  item.partner==="Hospital"?<LocalHospital sx={{ fontSize:"13px !important" }} />:
                                  <MedicalServices sx={{ fontSize:"13px !important" }} />}
                            label={item.partner} size="small"
                            sx={{ bgcolor:`${C.indigo}12`, color:C.indigo, fontWeight:600, fontSize:11 }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize:12 }}>{item.doctorName||item.hospitalName||"—"}</TableCell>
                      <TableCell sx={{ fontSize:12 }}>
                        {item.productsDetailed?.length>0
                          ? <Tooltip title={item.productsDetailed.join(", ")}>
                              <Chip label={`${item.productsDetailed.length} product(s)`} size="small"
                                sx={{ fontSize:10, bgcolor:`${C.purple}12`, color:C.purple, cursor:"pointer" }} />
                            </Tooltip>
                          : "—"}
                      </TableCell>
                      <TableCell sx={{ fontSize:12 }}>
                        {item.samplesGiven>0
                          ? <Chip label={`${item.samplesGiven} units`} size="small"
                              sx={{ fontSize:10, bgcolor:`${C.orange}12`, color:C.orange }} />
                          : "—"}
                      </TableCell>
                      <TableCell sx={{ fontSize:12 }}>{item.distanceKm||"—"}</TableCell>
                      <TableCell sx={{ fontSize:12, whiteSpace:"nowrap" }}>
                        {item.nextVisitDate?fmtDate(item.nextVisitDate):"—"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.status==="closed"?"Completed":
                                 item.status==="force_closed"?"Force Closed":"In Progress"}
                          size="small"
                          sx={{ bgcolor:`${STATUS_COLOR[item.status]||C.amber}15`,
                            color:STATUS_COLOR[item.status]||C.amber, fontWeight:700, fontSize:11 }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}