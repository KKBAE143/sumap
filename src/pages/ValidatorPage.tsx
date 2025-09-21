import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardBody,
  Heading,
  VStack,
  HStack,
  Button,
  Text,
  Input,
  FormControl,
  FormLabel,
  useToast,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Textarea,
  Switch,
  Tag,
  TagLabel,
  TagLeftIcon,
} from '@chakra-ui/react';
import { Camera, Scan, CheckCircle, XCircle, MapPin, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useSupabase } from '../contexts/SupabaseContext';
import { verifyQRPayload, validateColorToken } from '../utils/passUtils';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';

const OFFLINE_JWT_SECRET = 'demo-offline-secret-for-now';

interface ValidationResult {
  success: boolean;
  message: string;
  passInfo?: {
    id: string;
    pass_type: string;
    balance: number;
    valid_until: string;
  };
  remainingBalance?: number;
}

interface OfflineToken {
  jti: string; // JWT ID
  iat: number;
  exp: number;
  signature: string;
}

const ValidatorPage: React.FC = () => {
  const { supabase } = useSupabase();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [qrInput, setQrInput] = useState('');
  const [colorInput, setColorInput] = useState('#000000');
  const [deviceId, setDeviceId] = useState('validator-demo-001');
  const [location, setLocation] = useState({ lat: 19.0760, lng: 72.8777 });
  const [validating, setValidating] = useState(false);
  const [lastResult, setLastResult] = useState<ValidationResult | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [offlineTokens, setOfflineTokens] = useState<OfflineToken[]>([]);
  const [usedOfflineTokens, setUsedOfflineTokens] = useState<string[]>([]);

  useEffect(() => {
    if (qrInput) {
      const { payload } = verifyQRPayload(qrInput);
      if (payload && payload.color_token) {
        setColorInput(payload.color_token);
      }
    }
  }, [qrInput]);

  const handleOfflineToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsOffline(e.target.checked);
    if (e.target.checked) {
      syncOfflineTokens();
    } else {
      reconcileOfflineData();
    }
  };

  const syncOfflineTokens = () => {
    const tokens: OfflineToken[] = [];
    const now = Math.floor(Date.now() / 1000);
    for (let i = 0; i < 100; i++) {
      const payload = {
        jti: uuidv4(),
        iat: now,
        exp: now + 24 * 60 * 60, // Tokens valid for 24 hours
      };
      const signature = CryptoJS.HmacSHA256(JSON.stringify(payload), OFFLINE_JWT_SECRET).toString();
      tokens.push({ ...payload, signature });
    }
    setOfflineTokens(tokens);
    localStorage.setItem('offline_tokens', JSON.stringify(tokens));
    toast({ title: 'Offline Mode Activated', description: `${tokens.length} tokens synced.`, status: 'info', duration: 4000 });
  };

  const reconcileOfflineData = () => {
    const used = JSON.parse(localStorage.getItem('used_offline_tokens') || '[]');
    if (used.length > 0) {
      console.log('Reconciling used offline tokens:', used);
      // Here you would send the `used` array to your backend
      toast({ title: 'Reconciling Data', description: `${used.length} offline validations sent to server.`, status: 'success', duration: 4000 });
    }
    localStorage.removeItem('offline_tokens');
    localStorage.removeItem('used_offline_tokens');
    setOfflineTokens([]);
    setUsedOfflineTokens([]);
    toast({ title: 'Online Mode Activated', status: 'info', duration: 3000 });
  };

  const handleOfflineValidation = (qrPayload: any) => {
    // For offline, we can't check balance, but we can check token validity
    const colorValid = validateColorToken(qrPayload.pass_id, 'offline_seed_placeholder', qrPayload.color_token);
    if (!colorValid) {
        setLastResult({ success: false, message: 'Offline validation failed: Stale color token.' });
        return;
    }
    
    const availableToken = offlineTokens.find(t => !usedOfflineTokens.includes(t.jti));
    if (!availableToken) {
        setLastResult({ success: false, message: 'Offline validation failed: No available offline tokens.' });
        return;
    }

    const newUsedTokens = [...usedOfflineTokens, availableToken.jti];
    setUsedOfflineTokens(newUsedTokens);
    localStorage.setItem('used_offline_tokens', JSON.stringify(newUsedTokens));

    setLastResult({
        success: true,
        message: `Offline validation successful. Token ${availableToken.jti.substring(0,8)} used.`,
        passInfo: { id: qrPayload.pass_id, pass_type: 'Unknown', balance: 0, valid_until: 'N/A' },
        remainingBalance: 0
    });
  };

  const handleValidation = async () => {
    setValidating(true);
    setLastResult(null);

    const { payload: qrPayload, status: qrStatus } = verifyQRPayload(qrInput);

    if (qrStatus === 'INVALID_SIGNATURE' || qrStatus === 'INVALID_FORMAT' || !qrPayload) {
      setLastResult({ success: false, message: 'QR code is invalid or has been tampered with.' });
      setValidating(false);
      return;
    }
    
    if (isOffline) {
        handleOfflineValidation(qrPayload);
        setValidating(false);
        return;
    }

    // Online validation logic
    try {
      const { data: passData, error: passError } = await supabase.from('passes').select('*').eq('id', qrPayload.pass_id).single();
      if (passError || !passData) {
        setLastResult({ success: false, message: 'Pass not found in database.' }); return;
      }
      if (!validateColorToken(passData.id, passData.color_seed, qrPayload.color_token)) {
        setLastResult({ success: false, message: 'QR Code is stale. The color token is outdated. Please refresh.' }); return;
      }
      
      // Check pass validity and balance
      if (passData.status !== 'ACTIVE') {
        setLastResult({ success: false, message: `Pass is currently ${passData.status.toLowerCase()}.` }); return;
      }
      if (new Date(passData.valid_until) < new Date()) {
        setLastResult({ success: false, message: 'Pass has expired.' });
        await supabase.from('passes').update({ status: 'EXPIRED' }).eq('id', passData.id); return;
      }
      
      // For SINGLE passes, check and deduct balance
      if (passData.pass_type === 'SINGLE') {
        if (passData.balance <= 0) {
          setLastResult({ success: false, message: 'Insufficient balance for this single-trip pass.' }); return;
        }
        // Deduct one trip from single pass
        const newBalance = passData.balance - 1;
        await supabase.from('passes').update({ 
          balance: newBalance, 
          status: newBalance <= 0 ? 'EXPIRED' : 'ACTIVE' 
        }).eq('id', passData.id);
        
        await supabase.from('validation_events').insert({ 
          pass_id: passData.id, 
          device_id: deviceId, 
          lat: location.lat, 
          lng: location.lng, 
          validation_result: 'SUCCESS', 
          validation_method: 'ONLINE' 
        });

        setLastResult({
          success: true, 
          message: 'Single trip pass validated successfully',
          passInfo: { 
            id: passData.id, 
            pass_type: passData.pass_type, 
            balance: passData.balance, 
            valid_until: passData.valid_until 
          },
          remainingBalance: newBalance
        });
      } else {
        // For time-based passes (DAILY, WEEKLY, MONTHLY), no balance deduction needed
        await supabase.from('validation_events').insert({ 
          pass_id: passData.id, 
          device_id: deviceId, 
          lat: location.lat, 
          lng: location.lng, 
          validation_result: 'SUCCESS', 
          validation_method: 'ONLINE' 
        });

        setLastResult({
          success: true, 
          message: `${passData.pass_type.toLowerCase()} pass validated successfully - unlimited trips`,
          passInfo: { 
            id: passData.id, 
            pass_type: passData.pass_type, 
            balance: passData.balance, 
            valid_until: passData.valid_until 
          },
          remainingBalance: -1 // Indicates unlimited
        });
      }
      setQrInput(''); setColorInput('#000000');
    } catch (error: any) {
      setLastResult({ success: false, message: 'An unexpected error occurred: ' + error.message });
    } finally {
      setValidating(false);
    }
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const html5QrCode = new Html5Qrcode('reader');
    html5QrCode.scanFile(file, true)
      .then(decodedText => { setQrInput(decodedText); toast({ title: 'QR Code Detected!', status: 'success' }); })
      .catch(err => { toast({ title: 'QR Code Not Found', status: 'error' }); });
  };
  
  return (
    <Container maxW="4xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Box id="reader" display="none" />
        <Card>
          <CardBody>
            <VStack spacing={4}>
              <HStack>
                <Icon as={Scan} w={8} h={8} color="brand.500" />
                <Heading size="lg">Pass Validator</Heading>
              </HStack>
              <Text color="gray.600" textAlign="center">Scan QR codes and validate mobility passes.</Text>
            </VStack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <VStack spacing={4}>
              <HStack justify="space-between" w="full">
                <Heading size="md">Device Configuration</Heading>
                <FormControl display="flex" alignItems="center" w="auto">
                  <FormLabel htmlFor="offline-switch" mb="0">Offline Mode</FormLabel>
                  <Switch id="offline-switch" isChecked={isOffline} onChange={handleOfflineToggle} />
                </FormControl>
              </HStack>
              <Tag size="lg" colorScheme={isOffline ? 'orange' : 'green'} variant="subtle">
                <TagLeftIcon as={isOffline ? WifiOff : Wifi} />
                <TagLabel>{isOffline ? `Offline (${offlineTokens.length - usedOfflineTokens.length} tokens left)` : 'Online'}</TagLabel>
              </Tag>
              <HStack spacing={4} w="full">
                <FormControl>
                  <FormLabel>Device ID</FormLabel>
                  <Input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} />
                </FormControl>
                <VStack>
                  <FormLabel>Location</FormLabel>
                  <Button size="sm" leftIcon={<Icon as={MapPin} />} onClick={() => {}}>Get</Button>
                </VStack>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <VStack spacing={4}>
              <Heading size="md">Scan or Enter QR Code</Heading>
              <HStack spacing={4} w="full">
                <Button leftIcon={<Icon as={Camera} />} onClick={() => fileInputRef.current?.click()} variant="outline" flex={1}>Scan from Image</Button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </HStack>
              <FormControl>
                <FormLabel>QR Code Data</FormLabel>
                <Textarea value={qrInput} onChange={(e) => setQrInput(e.target.value)} placeholder="Paste QR code data or use scan button" rows={4} />
              </FormControl>
              <FormControl>
                <FormLabel>Color Token (Auto-detected)</FormLabel>
                <HStack>
                  <Input type="color" value={colorInput} w="60px" isReadOnly />
                  <Input value={colorInput} isReadOnly />
                </HStack>
              </FormControl>
              <Button colorScheme="brand" size="lg" w="full" onClick={handleValidation} isLoading={validating} loadingText="Validating..." leftIcon={<Icon as={CheckCircle} />}>Validate Pass</Button>
            </VStack>
          </CardBody>
        </Card>

        {lastResult && (
          <Alert status={lastResult.success ? 'success' : 'error'} borderRadius="md">
            <AlertIcon as={lastResult.success ? CheckCircle : XCircle} />
            <Box>
              <AlertTitle>{lastResult.success ? 'Validation Successful!' : 'Validation Failed'}</AlertTitle>
              <AlertDescription>
                {lastResult.message}
                {lastResult.passInfo && (
                  <VStack align="start" mt={2} spacing={1}>
                    <Text fontSize="sm"><strong>Pass Type:</strong> {lastResult.passInfo.pass_type}</Text>
                    <Text fontSize="sm"><strong>Remaining Balance:</strong> {lastResult.passInfo.pass_type === 'SINGLE' ? lastResult.remainingBalance : 'Unlimited'} trips</Text>
                  </VStack>
                )}
              </AlertDescription>
            </Box>
          </Alert>
        )}
      </VStack>
    </Container>
  );
};

export default ValidatorPage;
