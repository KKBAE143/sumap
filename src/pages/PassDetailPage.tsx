import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardBody,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Image,
  useToast,
  Spinner,
  Icon,
  Divider,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/react';
import { useParams, Navigate } from 'react-router-dom';
import { QrCode, Calendar, CreditCard, MapPin, Shield, Download, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSupabase } from '../contexts/SupabaseContext';
import { generateQRCode } from '../utils/passUtils';

interface PassDetail {
  id: string;
  pass_type: string;
  status: string;
  valid_from: string;
  valid_until: string;
  balance: number;
  color_seed: string;
  created_at: string;
  operator?: {
    name: string;
  };
}

const PassDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { supabase } = useSupabase();
  const toast = useToast();
  
  const [pass, setPass] = useState<PassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [colorToken, setColorToken] = useState<string>('');
  const [generatingQR, setGeneratingQR] = useState(false);
  const [qrExpiry, setQrExpiry] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    if (user && id) {
      fetchPassDetail();
      
      const storedQR = sessionStorage.getItem(`qr_${id}`);
      if (storedQR) {
        try {
          const { qrData, payload } = JSON.parse(storedQR);
          const now = Math.floor(Date.now() / 1000);

          if (payload && payload.exp > now) {
            setQrCodeData(qrData);
            setColorToken(payload.color_token);
            setQrExpiry(payload.exp);
          } else {
            sessionStorage.removeItem(`qr_${id}`);
          }
        } catch (e) {
          console.error("Failed to parse stored QR data", e);
          sessionStorage.removeItem(`qr_${id}`);
        }
      }
    }
  }, [user, id]);

  // Separate useEffect for real-time subscription to avoid flickering
  useEffect(() => {
    if (user && id && pass) {
      // Set up real-time subscription for validation events to update balance
      const validationSubscription = supabase
        .channel('public:validation_events')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'validation_events',
          filter: `pass_id=eq.${id}`
        }, (payload) => {
          // Refresh pass details when a validation occurs for this pass
          fetchPassDetail();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(validationSubscription);
      };
    }
  }, [user, id, pass?.id]);

  useEffect(() => {
    if (!qrExpiry) return;
  
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const timeLeft = qrExpiry - now;
      setCountdown(Math.max(0, timeLeft));
      
      if (timeLeft <= 0) {
        setQrCodeData('');
        setColorToken('');
        setQrExpiry(null);
        sessionStorage.removeItem(`qr_${id}`);
        clearInterval(interval);
        toast({
          title: 'QR Code Expired',
          description: 'Please generate a new QR code for validation.',
          status: 'warning',
          duration: 4000,
          isClosable: true,
        });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [qrExpiry, id, toast]);

  const fetchPassDetail = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('passes')
        .select(`
          *,
          operators (name)
        `)
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();
      
      if (error) throw error;
      
      if (!data) {
        toast({
          title: 'Pass not found',
          description: 'The requested pass could not be found.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      setPass(data);
      
    } catch (error: any) {
      toast({
        title: 'Error loading pass',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!pass) return;
    
    try {
      setGeneratingQR(true);
      
      const { qrCodeDataUrl, payload } = await generateQRCode(pass.id, pass.color_seed);
      setQrCodeData(qrCodeDataUrl);
      setColorToken(payload.color_token);
      setQrExpiry(payload.exp);
      
      sessionStorage.setItem(`qr_${id}`, JSON.stringify({ qrData: qrCodeDataUrl, payload }));
      
      toast({
        title: 'QR code generated',
        description: 'Your pass QR code is ready for validation.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error: any) {
      toast({
        title: 'Error generating QR code',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setGeneratingQR(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'green';
      case 'EXPIRED': return 'red';
      case 'SUSPENDED': return 'orange';
      default: return 'gray';
    }
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  if (authLoading || loading) {
    return (
      <Container maxW="4xl" py={8}>
        <VStack spacing={8}>
          <Spinner size="xl" />
          <Text>Loading pass details...</Text>
        </VStack>
      </Container>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!pass) {
    return (
      <Container maxW="4xl" py={8}>
        <Card>
          <CardBody>
            <VStack spacing={4}>
              <Heading size="md" color="red.500">Pass Not Found</Heading>
              <Text>The requested pass could not be found or you don't have access to it.</Text>
              <Button as="a" href="/dashboard" colorScheme="brand">
                Back to Dashboard
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxW="4xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Card>
          <CardBody>
            <HStack justify="space-between" align="start">
              <VStack align="start" spacing={2}>
                <HStack>
                  <Icon as={CreditCard} w={6} h={6} color="brand.500" />
                  <Heading size="lg">{pass.pass_type} Pass</Heading>
                  <Badge colorScheme={getStatusColor(pass.status)} fontSize="md">
                    {pass.status}
                  </Badge>
                </HStack>
                
                <Text color="gray.600">
                  Pass ID: {pass.id.substring(0, 8)}...
                </Text>
                
                {pass.operator && (
                  <HStack>
                    <Icon as={MapPin} />
                    <Text>{pass.operator.name}</Text>
                  </HStack>
                )}
              </VStack>
              
              <VStack align="end" spacing={1}>
                <Text fontSize="2xl" fontWeight="bold">
                  {pass.pass_type === 'SINGLE' ? `${pass.balance} trip${pass.balance !== 1 ? 's' : ''}` : 'Unlimited'}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Remaining balance
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Valid From</StatLabel>
                <StatNumber fontSize="lg">
                  {new Date(pass.valid_from).toLocaleDateString()}
                </StatNumber>
                <StatHelpText>
                  {new Date(pass.valid_from).toLocaleTimeString()}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Valid Until</StatLabel>
                <StatNumber fontSize="lg" color={isExpired(pass.valid_until) ? 'red.500' : 'green.500'}>
                  {new Date(pass.valid_until).toLocaleDateString()}
                </StatNumber>
                <StatHelpText>
                  {isExpired(pass.valid_until) ? 'Expired' : 'Active'}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Pass Type</StatLabel>
                <StatNumber fontSize="lg">
                  {pass.pass_type}
                </StatNumber>
                <StatHelpText>
                  Created {new Date(pass.created_at).toLocaleDateString()}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Card>
          <CardBody>
            <VStack spacing={6}>
              <HStack>
                <Icon as={QrCode} w={6} h={6} color="brand.500" />
                <Heading size="md">Your Pass</Heading>
              </HStack>
              
              {qrCodeData ? (
                <VStack spacing={4}>
                  <Box bg="white" p={6} borderRadius="lg" borderWidth={2}>
                    <Image 
                      src={qrCodeData} 
                      alt="Pass QR Code" 
                      w="200px" 
                      h="200px"
                      mx="auto"
                    />
                  </Box>
                  
                  <VStack spacing={2}>
                    <HStack>
                      <Icon as={Shield} />
                      <Text fontWeight="semibold">Dynamic Color Token:</Text>
                    </HStack>
                    <Box 
                      w="60px" 
                      h="60px" 
                      bg={colorToken}
                      borderRadius="md"
                      border="2px solid"
                      borderColor="gray.300"
                    />
                    <Text fontSize="sm" color="gray.600">
                      {colorToken}
                    </Text>
                  </VStack>

                  <Box>
                    <Text fontSize="lg" color="red.500" fontWeight="bold" textAlign="center">
                      {countdown}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      QR code expires in seconds
                    </Text>
                  </Box>
                  
                  <Divider />
                  
                  <Text fontSize="sm" color="gray.600" textAlign="center" maxW="md">
                    Show this QR code to the validator along with the color token for verification.
                  </Text>
                  
                  <HStack>
                    <Button 
                      leftIcon={<Icon as={RefreshCw} />}
                      onClick={handleGenerateQR}
                      isLoading={generatingQR}
                      loadingText="Refreshing..."
                    >
                      Refresh
                    </Button>
                    <Button 
                      leftIcon={<Icon as={Download} />}
                      variant="outline"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.download = `pass-${pass.id.substring(0, 8)}.png`;
                        link.href = qrCodeData;
                        link.click();
                      }}
                    >
                      Download
                    </Button>
                  </HStack>
                </VStack>
              ) : (
                <VStack spacing={4}>
                  <Text color="gray.600">
                    Generate a QR code to use this pass for validation.
                  </Text>
                  <Button 
                    colorScheme="brand"
                    leftIcon={<Icon as={QrCode} />}
                    onClick={handleGenerateQR}
                    isLoading={generatingQR}
                    loadingText="Generating..."
                    size="lg"
                  >
                    Generate QR Code
                  </Button>
                </VStack>
              )}
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default PassDetailPage;
