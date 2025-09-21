import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Button,
  Card,
  CardBody,
  Text,
  Badge,
  SimpleGrid,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Select,
  NumberInput,
  NumberInputField,
  useDisclosure,
  Spinner,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/react';
import { Link, Navigate } from 'react-router-dom';
import { Plus, CreditCard, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSupabase } from '../contexts/SupabaseContext';

interface Pass {
  id: string;
  pass_type: string;
  status: string;
  valid_from: string;
  valid_until: string;
  balance: number;
  created_at: string;
  operator?: {
    name: string;
  };
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  pass?: {
    pass_type: string;
  };
}

const DashboardPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { supabase } = useSupabase();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [passes, setPasses] = useState<Pass[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Form state
  const [passType, setPassType] = useState('SINGLE');
  const [amount, setAmount] = useState(50);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  // Separate useEffect for real-time subscription to avoid flickering
  useEffect(() => {
    if (user && passes.length > 0) {
      // Set up real-time subscription for validation events to update balance
      const validationSubscription = supabase
        .channel('public:validation_events')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'validation_events',
          filter: `pass_id=in.(${passes.map(p => p.id).join(',')})`
        }, (payload) => {
          // Refresh user data when a validation occurs for user's passes
          fetchUserData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(validationSubscription);
      };
    }
  }, [user, passes.map(p => p.id).join(',')]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch user passes
      const { data: passesData, error: passesError } = await supabase
        .from('passes')
        .select(`
          *,
          operators (name)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (passesError) throw passesError;
      setPasses(passesData || []);
      
      // Fetch user transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          passes (pass_type)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);
      
    } catch (error: any) {
      toast({
        title: 'Error loading data',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePass = async () => {
    try {
      setCreating(true);
      
      // Calculate validity period based on pass type
      const now = new Date();
      const validFrom = now.toISOString();
      let validUntil: string;
      let balance: number;
      
      switch (passType) {
        case 'DAILY':
          validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
          balance = -1; // Unlimited trips for time-based passes
          break;
        case 'WEEKLY':
          validUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
          balance = -1; // Unlimited trips for time-based passes
          break;
        case 'MONTHLY':
          validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
          balance = -1; // Unlimited trips for time-based passes
          break;
        default: // SINGLE
          validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
          balance = 1; // Single trip
      }
      
      // Create pass record
      const { data: passData, error: passError } = await supabase
        .from('passes')
        .insert({
          user_id: user?.id,
          pass_type: passType,
          valid_from: validFrom,
          valid_until: validUntil,
          balance: balance,
          color_seed: Math.random().toString(36).substring(7)
        })
        .select()
        .single();
      
      if (passError) throw passError;
      
      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          pass_id: passData.id,
          amount: amount,
          currency: 'INR',
          status: 'COMPLETED' // For demo, mark as completed
        });
      
      if (transactionError) throw transactionError;
      
      toast({
        title: 'Pass created successfully!',
        description: `Your ${passType.toLowerCase()} pass is ready to use.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      onClose();
      fetchUserData();
      
    } catch (error: any) {
      toast({
        title: 'Error creating pass',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCreating(false);
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

  const getPassTypeAmount = (type: string) => {
    switch (type) {
      case 'SINGLE': return 50;
      case 'DAILY': return 100;
      case 'WEEKLY': return 500;
      case 'MONTHLY': return 1500;
      default: return 50;
    }
  };

  if (authLoading) {
    return (
      <Container maxW="7xl" py={8}>
        <VStack spacing={8}>
          <Spinner size="xl" />
          <Text>Loading...</Text>
        </VStack>
      </Container>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <Heading>My Dashboard</Heading>
          <Button leftIcon={<Icon as={Plus} />} colorScheme="brand" onClick={onOpen}>
            New Pass
          </Button>
        </HStack>

        {/* Stats */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Active Passes</StatLabel>
                <StatNumber>{passes.filter(p => p.status === 'ACTIVE').length}</StatNumber>
                <StatHelpText>Currently valid</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Spent</StatLabel>
                <StatNumber>
                  ₹{transactions.reduce((sum, t) => sum + (t.status === 'COMPLETED' ? t.amount : 0), 0)}
                </StatNumber>
                <StatHelpText>This month</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Last Transaction</StatLabel>
                <StatNumber>
                  {transactions.length > 0 ? 
                    new Date(transactions[0].created_at).toLocaleDateString() : 
                    'None'
                  }
                </StatNumber>
                <StatHelpText>Recent activity</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Active Passes */}
        <Box>
          <Heading size="lg" mb={4}>My Passes</Heading>
          {loading ? (
            <Card>
              <CardBody>
                <VStack>
                  <Spinner />
                  <Text>Loading passes...</Text>
                </VStack>
              </CardBody>
            </Card>
          ) : passes.length === 0 ? (
            <Card>
              <CardBody>
                <VStack spacing={4}>
                  <Text color="gray.500">No passes found</Text>
                  <Button colorScheme="brand" onClick={onOpen}>
                    Create Your First Pass
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {passes.map((pass) => (
                <Card key={pass.id}>
                  <CardBody>
                    <VStack align="start" spacing={3}>
                      <HStack justify="space-between" w="full">
                        <Badge colorScheme={getStatusColor(pass.status)}>
                          {pass.status}
                        </Badge>
                        <Text fontSize="sm" color="gray.500">
                          {pass.pass_type}
                        </Text>
                      </HStack>
                      
                      <VStack align="start" spacing={1}>
                        <HStack>
                          <Icon as={CreditCard} />
                          <Text fontWeight="semibold">
                            Balance: {pass.pass_type === 'SINGLE' ? `${pass.balance} trip${pass.balance !== 1 ? 's' : ''}` : 'Unlimited'}
                          </Text>
                        </HStack>
                        
                        <HStack>
                          <Icon as={Calendar} />
                          <Text fontSize="sm">
                            Valid until: {new Date(pass.valid_until).toLocaleDateString()}
                          </Text>
                        </HStack>
                        
                        {pass.operator && (
                          <HStack>
                            <Icon as={MapPin} />
                            <Text fontSize="sm">{pass.operator.name}</Text>
                          </HStack>
                        )}
                      </VStack>
                      
                      <Button as={Link} to={`/passes/${pass.id}`} w="full" variant="outline">
                        View Details
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Box>

        {/* Recent Transactions */}
        <Box>
          <Heading size="lg" mb={4}>Recent Transactions</Heading>
          {transactions.length === 0 ? (
            <Card>
              <CardBody>
                <Text color="gray.500" textAlign="center">No transactions found</Text>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  {transactions.map((transaction) => (
                    <HStack key={transaction.id} justify="space-between" p={3} borderWidth={1} borderRadius="md">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="semibold">
                          {transaction.pass?.pass_type || 'Pass'} Purchase
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </Text>
                      </VStack>
                      
                      <VStack align="end" spacing={1}>
                        <Text fontWeight="semibold">
                          ₹{transaction.amount}
                        </Text>
                        <Badge colorScheme={transaction.status === 'COMPLETED' ? 'green' : 'orange'}>
                          {transaction.status}
                        </Badge>
                      </VStack>
                    </HStack>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          )}
        </Box>
      </VStack>

      {/* Create Pass Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Pass</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Pass Type</FormLabel>
                <Select value={passType} onChange={(e) => {
                  setPassType(e.target.value);
                  setAmount(getPassTypeAmount(e.target.value));
                }}>
                  <option value="SINGLE">Single Trip - ₹50</option>
                  <option value="DAILY">Daily Pass - ₹100</option>
                  <option value="WEEKLY">Weekly Pass - ₹500</option>
                  <option value="MONTHLY">Monthly Pass - ₹1500</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Amount (₹)</FormLabel>
                <NumberInput value={amount} onChange={(valueString) => setAmount(Number(valueString))}>
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              
              <Text fontSize="sm" color="gray.600">
                This will create a new pass and process payment using Stripe.
                For demo purposes, the payment is marked as completed automatically.
              </Text>
              
              <HStack spacing={3} w="full">
                <Button variant="outline" onClick={onClose} flex={1}>
                  Cancel
                </Button>
                <Button 
                  colorScheme="brand" 
                  onClick={handleCreatePass}
                  isLoading={creating}
                  loadingText="Creating..."
                  flex={1}
                >
                  Create Pass
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default DashboardPage;
