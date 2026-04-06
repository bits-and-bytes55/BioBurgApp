import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Grid,
  Typography,
  Button,
  Box,
  Container,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Chip,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  Snackbar,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Divider,
  Avatar,
  Badge,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Radio,
  RadioGroup,
  FormControlLabel,
  Tab,
  Tabs,
  CardMedia,
  Rating,
  Stepper,
  Step,
  StepLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Popover,
  Menu,
  ListItemButton,
  Backdrop,
  Fade,
  Modal,
  Zoom,
  Grow,
  Slide,
} from "@mui/material";
import { styled, alpha } from "@mui/material/styles";
import {
  Search,
  FilterList,
  Sort,
  GridView,
  ViewList,
  Refresh,
  Fullscreen,
  FullscreenExit,
  Download,
  Upload,
  Print,
  Share,
  QrCode,
  Inventory,
  Category,
  TrendingUp,
  Star,
  Bolt,
  LocalOffer,
  MedicalServices,
  Visibility,
  CompareArrows,
  AddShoppingCart,
  Group,
  Dashboard,
  Analytics,
  Settings,
  DarkMode,
  LightMode,
  Notifications,
  Person,
  Close,
  CheckCircle,
  Error,
  Warning,
  Info,
  ExpandMore,
  ChevronRight,
  FilterAlt,
  Tune,
  ViewModule,
  ViewComfy,
  ViewStream,
  Apps,
  MoreVert,
  ZoomIn,
  ZoomOut,
  RotateLeft,
  CenterFocusStrong,
  AddPhotoAlternate,
  Image,
  Collections,
  PictureAsPdf,
  TableChart,
  WhatsApp,
  Email,
  Facebook,
  Twitter,
  LinkedIn,
  ContentCopy,
  FileDownload,
  RemoveRedEye,
  Edit,
  Delete,
  Favorite,
  FavoriteBorder,
  ShoppingCart,
  AttachMoney,
  BarChart,
  PieChart,
  ShowChart,
  Timeline,
  DataUsage,
  Storage,
  Cloud,
  CloudOff,
  Sync,
  SyncDisabled,
  Wifi,
  WifiOff,
  BatteryFull,
  BatteryChargingFull,
  Memory,
  Speed,
  AccessTime,
  CalendarToday,
  Today,
  DateRange,
  Schedule,
  Timer,
  HourglassEmpty,
  HourglassFull,
  Lock,
  LockOpen,
  VisibilityOff,
  VpnKey,
  Security,
  VerifiedUser,
  GppGood,
  GppBad,
  Shield,
  Palette,
  ColorLens,
  Brush,
  FormatPaint,
  TextFields,
  Title,
  FormatSize,
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatColorFill,
  FormatColorText,
  Highlight,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatAlignJustify,
  FormatListBulleted,
  FormatListNumbered,
  FormatIndentIncrease,
  FormatIndentDecrease,
  FormatLineSpacing,
  FormatClear,
  Link,
  InsertLink,
  InsertPhoto,
  InsertEmoticon,
  InsertComment,
  InsertChart,
  InsertDriveFile,
  Folder,
  FolderOpen,
  CreateNewFolder,
  CloudUpload,
  CloudDownload,
  CloudDone,
  CloudQueue,
  CloudSync,
  DownloadDone,
  DownloadForOffline,
  OfflineBolt,
  OfflinePin,
  SignalCellularAlt,
  SignalWifi4Bar,
  SignalCellular4Bar,
  NetworkCheck,
  NetworkWifi,
  NetworkCell,
  Bluetooth,
  BluetoothSearching,
  BluetoothConnected,
  BluetoothDisabled,
  Usb,
  Cable,
  Power,
  PowerSettingsNew,
  BatteryAlert,
  BatteryStd,
  BatteryUnknown,
  Battery20,
  Battery30,
  Battery50,
  Battery60,
  Battery80,
  Battery90,
  SdStorage,
  SdCard,
  SimCard,
  Devices,
  DeviceUnknown,
  DeviceHub,
  Scanner,
  PrintDisabled,
  Fax,
  Router,
  Mouse,
  Keyboard,
  Headset,
  HeadsetMic,
  Speaker,
  SpeakerGroup,
  VolumeUp,
  VolumeOff,
  VolumeMute,
  VolumeDown,
} from "@mui/icons-material";
import AgentProductCard from "../components/ProductCard.jsx";
import { getCachedProducts, cacheProducts } from "../utils/offlineCache";
import { toggleFullscreen } from "../utils/fullscreen";
import OfflineIndicator from "../components/OfflineIndicator";

// Styled Components
const DashboardContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: theme.palette.mode === 'dark' 
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
  padding: theme.spacing(3),
}));

const Header = styled(Paper)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
  backdropFilter: 'blur(20px)',
  borderRadius: '24px',
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: theme.shadows[4],
}));

const StatsCard = styled(Card)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)'
    : 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
  borderRadius: '20px',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const SearchField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '16px',
    background: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    '&:hover': {
      background: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 1)',
    },
    '&.Mui-focused': {
      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
  },
}));

// Product Comparison Component
const ProductComparison = ({ open, onClose, productIds, products }) => {
  const selectedProducts = products.filter(p => productIds.includes(p._id));
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Compare Products</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Feature</TableCell>
                {selectedProducts.map(product => (
                  <TableCell key={product._id} align="center">
                    <Card sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                      <CardMedia
                        component="img"
                        height="100"
                        image={product.images?.[0]?.url || "/no-image.png"}
                        alt={product.title}
                        sx={{ objectFit: 'contain', mb: 1 }}
                      />
                      <Typography variant="subtitle2">{product.title}</Typography>
                    </Card>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Price</TableCell>
                {selectedProducts.map(product => (
                  <TableCell key={product._id} align="center">
                    <Typography variant="h6" color="primary">
                      ₹{product.price || product.mrp}
                    </Typography>
                    {product.discountPercent && (
                      <Typography variant="caption" color="error">
                        {product.discountPercent}% OFF
                      </Typography>
                    )}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Brand</TableCell>
                {selectedProducts.map(product => (
                  <TableCell key={product._id} align="center">
                    {product.brandName}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Category</TableCell>
                {selectedProducts.map(product => (
                  <TableCell key={product._id} align="center">
                    {product.category}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Stock</TableCell>
                {selectedProducts.map(product => (
                  <TableCell key={product._id} align="center">
                    <Chip
                      label={product.stock > 0 ? `In Stock (${product.stock})` : "Out of Stock"}
                      color={product.stock > 0 ? "success" : "error"}
                      size="small"
                    />
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Type</TableCell>
                {selectedProducts.map(product => (
                  <TableCell key={product._id} align="center">
                    <Chip
                      label={product.isOTC ? "OTC" : "Rx Only"}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Description</TableCell>
                {selectedProducts.map(product => (
                  <TableCell key={product._id} align="center">
                    <Typography variant="body2">
                      {product.shortDescription}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={() => window.print()}>
          Print Comparison
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Product QR Generator Component
const ProductQRGenerator = ({ open, onClose, productIds, products }) => {
  const [selectedFormat, setSelectedFormat] = useState('png');
  const [size, setSize] = useState(200);
  const selectedProducts = products.filter(p => productIds.includes(p._id));
  
  const generateQRUrl = (product) => {
    // In real app, this would generate actual QR code
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(JSON.stringify({
      id: product._id,
      title: product.title,
      price: product.price || product.mrp,
      brand: product.brandName,
    }))}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Generate QR Codes</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small">
              <InputLabel>Format</InputLabel>
              <Select
                value={selectedFormat}
                label="Format"
                onChange={(e) => setSelectedFormat(e.target.value)}
                sx={{ minWidth: 100 }}
              >
                <MenuItem value="png">PNG</MenuItem>
                <MenuItem value="svg">SVG</MenuItem>
                <MenuItem value="pdf">PDF</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ width: 200 }}>
              <Typography variant="body2" gutterBottom>
                Size: {size}px
              </Typography>
              <Slider
                value={size}
                onChange={(e, value) => setSize(value)}
                min={100}
                max={500}
                step={50}
              />
            </Box>
          </Stack>
          
          <Grid container spacing={2}>
            {selectedProducts.map(product => (
              <Grid item xs={12} sm={6} md={4} key={product._id}>
                <Card sx={{ p: 2, textAlign: 'center' }}>
                  <img
                    src={generateQRUrl(product)}
                    alt={`QR for ${product.title}`}
                    style={{ width: '100%', height: 'auto' }}
                  />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    {product.title}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Download />}
                    sx={{ mt: 1 }}
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = generateQRUrl(product);
                      link.download = `QR-${product.title}.${selectedFormat}`;
                      link.click();
                    }}
                  >
                    Download
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          onClick={() => {
            // Batch download all QR codes
            selectedProducts.forEach(product => {
              const link = document.createElement('a');
              link.href = generateQRUrl(product);
              link.download = `QR-${product.title}.${selectedFormat}`;
              link.click();
            });
          }}
        >
          Download All
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Export Options Component
const ExportOptions = ({ open, onClose, onExport, data }) => {
  const [format, setFormat] = useState('excel');
  const [includeImages, setIncludeImages] = useState(false);
  const [selectedFields, setSelectedFields] = useState([
    'title', 'brandName', 'category', 'price', 'stock', 'isOTC'
  ]);

  const fields = [
    { id: 'title', label: 'Product Name' },
    { id: 'brandName', label: 'Brand' },
    { id: 'category', label: 'Category' },
    { id: 'price', label: 'Price' },
    { id: 'mrp', label: 'MRP' },
    { id: 'discountPercent', label: 'Discount %' },
    { id: 'stock', label: 'Stock' },
    { id: 'isOTC', label: 'OTC/Rx' },
    { id: 'shortDescription', label: 'Description' },
  ];

  const handleExport = () => {
    onExport(format);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Export Products</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          <FormControl fullWidth>
            <InputLabel>Export Format</InputLabel>
            <Select
              value={format}
              label="Export Format"
              onChange={(e) => setFormat(e.target.value)}
            >
              <MenuItem value="excel">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <TableChart />
                  <span>Excel (.xlsx)</span>
                </Stack>
              </MenuItem>
              <MenuItem value="csv">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <InsertDriveFile />
                  <span>CSV (.csv)</span>
                </Stack>
              </MenuItem>
              <MenuItem value="pdf">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PictureAsPdf />
                  <span>PDF (.pdf)</span>
                </Stack>
              </MenuItem>
              <MenuItem value="json">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Code />
                  <span>JSON (.json)</span>
                </Stack>
              </MenuItem>
            </Select>
          </FormControl>

          <Divider />

          <Typography variant="subtitle2">Select Fields to Export</Typography>
          <Grid container spacing={1}>
            {fields.map(field => (
              <Grid item xs={6} key={field.id}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedFields.includes(field.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFields([...selectedFields, field.id]);
                        } else {
                          setSelectedFields(selectedFields.filter(f => f !== field.id));
                        }
                      }}
                    />
                  }
                  label={field.label}
                />
              </Grid>
            ))}
          </Grid>

          <FormControlLabel
            control={
              <Switch
                checked={includeImages}
                onChange={(e) => setIncludeImages(e.target.checked)}
              />
            }
            label="Include Product Images"
          />

          <Alert severity="info">
            Exporting {data.length} products with {selectedFields.length} fields
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleExport} startIcon={<Download />}>
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Print Preview Component
const PrintPreview = ({ open, onClose, onPrint, products }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Print Preview</Typography>
          <Stack direction="row" spacing={1}>
            <IconButton size="small">
              <ZoomIn />
            </IconButton>
            <IconButton size="small">
              <ZoomOut />
            </IconButton>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Box id="print-content" sx={{ p: 3, background: 'white' }}>
          <Typography variant="h4" align="center" gutterBottom>
            Product Catalogue
          </Typography>
          <Typography variant="subtitle1" align="center" color="text.secondary" gutterBottom>
            Generated on {new Date().toLocaleDateString()}
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Image</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Brand</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map(product => (
                  <TableRow key={product._id}>
                    <TableCell>
                      <Box sx={{ width: 60, height: 60 }}>
                        <img
                          src={product.images?.[0]?.url || "/no-image.png"}
                          alt={product.title}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>{product.title}</TableCell>
                    <TableCell>{product.brandName}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>₹{product.price || product.mrp}</TableCell>
                    <TableCell>
                      <Chip
                        label={product.stock > 0 ? `In Stock (${product.stock})` : "Out of Stock"}
                        color={product.stock > 0 ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={product.isOTC ? "OTC" : "Rx"}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => {
          const printContent = document.getElementById('print-content');
          const originalContent = document.body.innerHTML;
          document.body.innerHTML = printContent.innerHTML;
          window.print();
          document.body.innerHTML = originalContent;
          window.location.reload();
        }} startIcon={<Print />}>
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Share Dialog Component
const ShareDialog = ({ open, onClose, onShare, products }) => {
  const [selectedPlatform, setSelectedPlatform] = useState('whatsapp');
  const [message, setMessage] = useState('Check out these products!');

  const sharePlatforms = [
    { id: 'whatsapp', label: 'WhatsApp', icon: <WhatsApp />, color: '#25D366' },
    { id: 'email', label: 'Email', icon: <Email />, color: '#EA4335' },
    { id: 'facebook', label: 'Facebook', icon: <Facebook />, color: '#1877F2' },
    { id: 'twitter', label: 'Twitter', icon: <Twitter />, color: '#1DA1F2' },
    { id: 'linkedin', label: 'LinkedIn', icon: <LinkedIn />, color: '#0A66C2' },
    { id: 'copy', label: 'Copy Link', icon: <ContentCopy />, color: '#666666' },
  ];

  const generateShareContent = () => {
    const productList = products.map(p => `• ${p.title} - ₹${p.price || p.mrp}`).join('\n');
    return `${message}\n\n${productList}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Share Products</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          <Typography variant="subtitle2">Select Platform</Typography>
          <Grid container spacing={2}>
            {sharePlatforms.map(platform => (
              <Grid item xs={4} key={platform.id}>
                <Card
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: selectedPlatform === platform.id ? `2px solid ${platform.color}` : '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      borderColor: platform.color,
                      backgroundColor: alpha(platform.color, 0.05),
                    },
                  }}
                  onClick={() => setSelectedPlatform(platform.id)}
                >
                  <Box sx={{ color: platform.color, mb: 1 }}>
                    {platform.icon}
                  </Box>
                  <Typography variant="caption">{platform.label}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <Alert severity="info">
            Sharing {products.length} product{products.length !== 1 ? 's' : ''}
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => {
            const content = generateShareContent();
            switch (selectedPlatform) {
              case 'copy':
                navigator.clipboard.writeText(content);
                break;
              case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(content)}`, '_blank');
                break;
              case 'email':
                window.open(`mailto:?subject=Product Catalogue&body=${encodeURIComponent(content)}`, '_blank');
                break;
            }
            onShare(selectedPlatform);
          }}
          startIcon={<Share />}
          sx={{ backgroundColor: sharePlatforms.find(p => p.id === selectedPlatform)?.color }}
        >
          Share via {sharePlatforms.find(p => p.id === selectedPlatform)?.label}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Image Gallery Component
const ImageGallery = ({ open, onClose, products }) => {
  const [selectedProduct, setSelectedProduct] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoom, setZoom] = useState(1);

  const currentProduct = products[selectedProduct];
  const images = currentProduct?.images || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth fullScreen={useMediaQuery('(max-width:600px)')}>
      <DialogTitle sx={{ pb: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            {currentProduct?.title} - Image Gallery
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconButton onClick={() => setZoom(zoom + 0.1)}>
              <ZoomIn />
            </IconButton>
            <IconButton onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
              <ZoomOut />
            </IconButton>
            <IconButton onClick={() => setZoom(1)}>
              <RotateLeft />
            </IconButton>
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box
              sx={{
                position: 'relative',
                height: '60vh',
                overflow: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'grey.100',
                borderRadius: 2,
              }}
            >
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]?.url}
                  alt={`Product ${selectedImage + 1}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    transform: `scale(${zoom})`,
                    transition: 'transform 0.3s',
                  }}
                />
              ) : (
                <Typography color="text.secondary">No images available</Typography>
              )}
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              <Typography variant="subtitle2">Select Product</Typography>
              <Select
                value={selectedProduct}
                onChange={(e) => {
                  setSelectedProduct(e.target.value);
                  setSelectedImage(0);
                }}
                fullWidth
              >
                {products.map((product, index) => (
                  <MenuItem key={product._id} value={index}>
                    {product.title}
                  </MenuItem>
                ))}
              </Select>

              <Typography variant="subtitle2">Product Images</Typography>
              <Grid container spacing={1}>
                {images.map((img, index) => (
                  <Grid item xs={4} key={index}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: selectedImage === index ? 2 : 1,
                        borderColor: selectedImage === index ? 'primary.main' : 'divider',
                      }}
                      onClick={() => setSelectedImage(index)}
                    >
                      <CardMedia
                        component="img"
                        height="80"
                        image={img.url}
                        alt={`Thumbnail ${index + 1}`}
                        sx={{ objectFit: 'contain' }}
                      />
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Stack spacing={1}>
                <Typography variant="body2">
                  {images.length} image{images.length !== 1 ? 's' : ''} available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Zoom: {(zoom * 100).toFixed(0)}%
                </Typography>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

// Main Component
export default function AgentProducts() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState('grid');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  // Memoized values
  const uniqueCategories = useMemo(() => [...new Set(products.map(p => p.category))], [products]);
  const uniqueBrands = useMemo(() => [...new Set(products.map(p => p.brandName))], [products]);

  const [stats, setStats] = useState({
    total: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    otc: 0,
    rx: 0,
    categories: 0,
    brands: 0,
    totalValue: 0,
  });

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter and sort products
  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchQuery, selectedCategory, selectedBrand, stockFilter, priceRange, sortBy]);

  // Update fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(isFullscreen());
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('agentToken');
      
      const response = await axios.get('https://bioburglifescience-1.onrender.com/api/agent/products/all', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const productsData = response.data.products || [];
      setProducts(productsData);
      setFilteredProducts(productsData);
      updateStatistics(productsData);
      
      showSnackbar('Products loaded successfully', 'success');
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
      showSnackbar('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateStatistics = (data) => {
    const total = data.length;
    const inStock = data.filter(p => p.stock > 10).length;
    const lowStock = data.filter(p => p.stock > 0 && p.stock <= 10).length;
    const outOfStock = data.filter(p => p.stock === 0).length;
    const otc = data.filter(p => p.isOTC).length;
    const rx = data.filter(p => !p.isOTC).length;
    const categories = [...new Set(data.map(p => p.category))].length;
    const brands = [...new Set(data.map(p => p.brandName))].length;
    const totalValue = data.reduce((sum, p) => sum + (p.price || p.mrp) * p.stock, 0);

    setStats({
      total,
      inStock,
      lowStock,
      outOfStock,
      otc,
      rx,
      categories,
      brands,
      totalValue,
    });
  };

  const filterAndSortProducts = () => {
    let result = [...products];

    // Search filter
    if (searchQuery) {
      result = result.filter(product =>
        product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brandName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(product => product.category === selectedCategory);
    }

    // Brand filter
    if (selectedBrand !== 'all') {
      result = result.filter(product => product.brandName === selectedBrand);
    }

    // Stock filter
    if (stockFilter === 'inStock') {
      result = result.filter(product => product.stock > 10);
    } else if (stockFilter === 'lowStock') {
      result = result.filter(product => product.stock > 0 && product.stock <= 10);
    } else if (stockFilter === 'outOfStock') {
      result = result.filter(product => product.stock === 0);
    }

    // Price range filter
    result = result.filter(product => {
      const price = product.price || product.mrp;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sorting
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => (a.price || a.mrp) - (b.price || b.mrp));
        break;
      case 'price-high':
        result.sort((a, b) => (b.price || b.mrp) - (a.price || a.mrp));
        break;
      case 'discount':
        result.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
        break;
      case 'stock-high':
        result.sort((a, b) => b.stock - a.stock);
        break;
      case 'stock-low':
        result.sort((a, b) => a.stock - b.stock);
        break;
      case 'name':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      default:
        result.sort((a, b) => b.stock - a.stock);
    }

    setFilteredProducts(result);
  };

  const handleProductSelect = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleFullscreenToggle = () => {
    if (fullscreen) {
      exitFullscreen();
    } else {
      toggleFullscreen();
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleExportData = (format) => {
    showSnackbar(`Exporting data as ${format}...`, 'info');
  };

  const handlePrint = () => {
    showSnackbar('Printing...', 'info');
  };

  const handleShare = (platform) => {
    showSnackbar(`Sharing to ${platform}...`, 'info');
  };

  // Render functions
  const renderStatsCards = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {[
        { label: 'Total Products', value: stats.total, icon: <Inventory />, color: '#3b82f6' },
        { label: 'In Stock', value: stats.inStock, icon: <CheckCircle />, color: '#10b981' },
        { label: 'Low Stock', value: stats.lowStock, icon: <Warning />, color: '#f59e0b' },
        { label: 'Out of Stock', value: stats.outOfStock, icon: <Error />, color: '#ef4444' },
        { label: 'OTC Products', value: stats.otc, icon: <MedicalServices />, color: '#8b5cf6' },
        { label: 'Total Value', value: `₹${stats.totalValue.toLocaleString()}`, icon: <TrendingUp />, color: '#06b6d4' },
      ].map((stat, index) => (
        <Grid item xs={6} sm={4} md={2} key={index}>
          <StatsCard>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Box sx={{ color: stat.color }}>
                  {stat.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {stat.value}
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {stat.label}
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
      ))}
    </Grid>
  );

  const renderFilters = () => (
    <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <SearchField
              fullWidth
              placeholder="Search products, brands, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <Close />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {uniqueCategories.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="all">All Brands</MenuItem>
                  {uniqueBrands.map(brand => (
                    <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                >
                  <MenuItem value="all">All Stock</MenuItem>
                  <MenuItem value="inStock">In Stock</MenuItem>
                  <MenuItem value="lowStock">Low Stock</MenuItem>
                  <MenuItem value="outOfStock">Out of Stock</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="featured">Featured</MenuItem>
                  <MenuItem value="price-low">Price: Low to High</MenuItem>
                  <MenuItem value="price-high">Price: High to Low</MenuItem>
                  <MenuItem value="discount">Highest Discount</MenuItem>
                  <MenuItem value="stock-high">Stock: High to Low</MenuItem>
                  <MenuItem value="stock-low">Stock: Low to High</MenuItem>
                  <MenuItem value="name">Name A-Z</MenuItem>
                  <MenuItem value="newest">Newest First</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Grid>
        </Grid>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {selectedCategory !== 'all' && (
            <Chip
              label={`Category: ${selectedCategory}`}
              onDelete={() => setSelectedCategory('all')}
              variant="outlined"
              size="small"
            />
          )}
          {selectedBrand !== 'all' && (
            <Chip
              label={`Brand: ${selectedBrand}`}
              onDelete={() => setSelectedBrand('all')}
              variant="outlined"
              size="small"
            />
          )}
          {stockFilter !== 'all' && (
            <Chip
              label={`Stock: ${stockFilter}`}
              onDelete={() => setStockFilter('all')}
              variant="outlined"
              size="small"
            />
          )}
          {searchQuery && (
            <Chip
              label={`Search: "${searchQuery}"`}
              onDelete={() => setSearchQuery('')}
              variant="outlined"
              size="small"
            />
          )}
        </Stack>
      </Stack>
    </Paper>
  );

  return (
    <DashboardContainer>
      <Container maxWidth="xl">
        {/* Header */}
        <Header>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                Product Catalogue
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage and explore your product inventory
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <OfflineIndicator />
              <Tooltip title={fullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                <IconButton onClick={handleFullscreenToggle}>
                  {fullscreen ? <FullscreenExit /> : <Fullscreen />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Dark Mode">
                <IconButton onClick={() => setDarkMode(!darkMode)}>
                  {darkMode ? <LightMode /> : <DarkMode />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh">
                <IconButton onClick={fetchProducts} disabled={loading}>
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<Group />}
                onClick={handleFullscreenToggle}
                sx={{
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  fontWeight: 600,
                }}
              >
                Client Mode
              </Button>
            </Stack>
          </Stack>
        </Header>

        {/* Statistics */}
        {renderStatsCards()}

        {/* Filters */}
        {renderFilters()}

        {/* Bulk Actions Bar */}
        {selectedProducts.length > 0 && (
          <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {selectedProducts.length} product(s) selected
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<CompareArrows />}
                  onClick={() => setShowComparison(true)}
                  disabled={selectedProducts.length < 2}
                >
                  Compare
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => setShowExportDialog(true)}
                >
                  Export
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Print />}
                  onClick={() => setShowPrintDialog(true)}
                >
                  Print
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Share />}
                  onClick={() => setShowShareDialog(true)}
                >
                  Share
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setSelectedProducts([])}
                >
                  Clear
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}

        {/* View Controls */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {filteredProducts.length} products found
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                View:
              </Typography>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, value) => value && setViewMode(value)}
                size="small"
              >
                <ToggleButton value="grid">
                  <GridView />
                </ToggleButton>
                <ToggleButton value="list">
                  <ViewList />
                </ToggleButton>
              </ToggleButtonGroup>
              <Tooltip title="Advanced Filters">
                <IconButton onClick={() => setShowFilters(!showFilters)} size="small">
                  <Tune />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>

        {/* Loading State */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Products Grid */}
            <Grid container spacing={3}>
              {filteredProducts
                .slice((page - 1) * rowsPerPage, page * rowsPerPage)
                .map((product) => (
                  <Grid
                    item
                    xs={12}
                    sm={viewMode === 'grid' ? 6 : 12}
                    md={viewMode === 'grid' ? 4 : 12}
                    lg={viewMode === 'grid' ? 3 : 12}
                    key={product._id}
                  >
                    <AgentProductCard
                      product={product}
                      onSelect={() => handleProductSelect(product._id)}
                    />
                  </Grid>
                ))}
            </Grid>

            {/* No Results */}
            {filteredProducts.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 10 }}>
                <Inventory sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No products found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Try adjusting your search or filters
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedBrand('all');
                    setStockFilter('all');
                  }}
                >
                  Clear All Filters
                </Button>
              </Box>
            )}

            {/* Pagination */}
            {filteredProducts.length > rowsPerPage && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Button
                    variant="outlined"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Typography variant="body2">
                    Page {page} of {Math.ceil(filteredProducts.length / rowsPerPage)}
                  </Typography>
                  <Button
                    variant="outlined"
                    disabled={page === Math.ceil(filteredProducts.length / rowsPerPage)}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </Stack>
              </Box>
            )}
          </>
        )}

        {/* Speed Dial for Quick Actions */}
        <SpeedDial
          ariaLabel="Quick Actions"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
        >
          <SpeedDialAction
            icon={<QrCode />}
            tooltipTitle="Generate QR"
            onClick={() => {
              if (selectedProducts.length > 0) {
                setShowQRDialog(true);
              } else {
                showSnackbar('Select products first', 'warning');
              }
            }}
          />
          <SpeedDialAction
            icon={<Download />}
            tooltipTitle="Export"
            onClick={() => setShowExportDialog(true)}
          />
          <SpeedDialAction
            icon={<Print />}
            tooltipTitle="Print"
            onClick={() => setShowPrintDialog(true)}
          />
          <SpeedDialAction
            icon={<Share />}
            tooltipTitle="Share"
            onClick={() => {
              if (selectedProducts.length > 0) {
                setShowShareDialog(true);
              } else {
                showSnackbar('Select products first', 'warning');
              }
            }}
          />
          <SpeedDialAction
            icon={<Image />}
            tooltipTitle="Gallery"
            onClick={() => {
              if (products.length > 0) {
                setShowImageGallery(true);
              }
            }}
          />
        </SpeedDial>

        {/* Dialogs - All defined inline above */}
        <ProductComparison
          open={showComparison}
          onClose={() => setShowComparison(false)}
          productIds={selectedProducts}
          products={products}
        />

        <ProductQRGenerator
          open={showQRDialog}
          onClose={() => setShowQRDialog(false)}
          productIds={selectedProducts}
          products={products}
        />

        <ExportOptions
          open={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          onExport={handleExportData}
          data={filteredProducts}
        />

        <PrintPreview
          open={showPrintDialog}
          onClose={() => setShowPrintDialog(false)}
          onPrint={handlePrint}
          products={selectedProducts.length > 0 
            ? products.filter(p => selectedProducts.includes(p._id))
            : filteredProducts
          }
        />

        <ShareDialog
          open={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          onShare={handleShare}
          products={selectedProducts.length > 0 
            ? products.filter(p => selectedProducts.includes(p._id))
            : filteredProducts
          }
        />

        <ImageGallery
          open={showImageGallery}
          onClose={() => setShowImageGallery(false)}
          products={products}
        />

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </DashboardContainer>
  );
}

// Missing icon component
const Code = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
  </svg>
);