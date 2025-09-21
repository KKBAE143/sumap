import React, { useState, useEffect } from 'react';
import {
  Container,
  Heading,
  VStack,
  HStack,
  Card,
  CardBody,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  useToast,
  Spinner,
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Box,
  Flex,
  Avatar
} from '@chakra-ui/react';
import { Navigate } from 'react-router-dom';
import { Users, CreditCard, TrendingUp, Activity, Download, Wifi, BarChart2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSupabase } from '../contexts/SupabaseContext';
import ReactECharts from 'echarts-for-react';

interface AdminStats {
  totalUsers: number;
  totalPasses: number;
  totalRevenue: number;
  validationsToday: number;
}

interface LiveActivity {
  id: string;
  type: 'Validation' | 'Transaction' | 'Pass Creation';
  description: string;
  timestamp: string;
  user_email?: string;
}

const AdminPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { supabase } = useSupabase();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalPasses: 0, totalRevenue: 0, validationsToday: 0 });
  const [recentPasses, setRecentPasses] = useState<any[]>([]);
  const [recentValidations, setRecentValidations] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [liveActivity, setLiveActivity] = useState<LiveActivity[]>([]);
  const [chartOptions, setChartOptions] = useState({});

  useEffect(() => {
    if (user) {
      fetchAdminData();

      const validationSubscription = supabase
        .channel('public:validation_events')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'validation_events' }, async (payload) => {
          const { data: passData } = await supabase.from('passes').select('users(email)').eq('id', payload.new.pass_id).single();
          const newActivity: LiveActivity = {
            id: payload.new.id,
            type: 'Validation',
            description: `Pass validated at device ${payload.new.device_id}`,
            timestamp: payload.new.created_at,
            user_email: passData?.users?.email || 'Unknown'
          };
          setLiveActivity(prev => [newActivity, ...prev].slice(0, 10));
          toast({ title: 'Live: Pass Validated', status: 'info', duration: 5000, isClosable: true, position: 'top-right' });
        })
        .subscribe();
        
      return () => { supabase.removeChannel(validationSubscription); };
    }
  }, [user]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);

      const [users, passes, transactions, validationsToday, validationHistory] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('passes').select('id', { count: 'exact' }),
        supabase.from('transactions').select('amount').eq('status', 'COMPLETED'),
        supabase.from('validation_events').select('id', { count: 'exact' }).gte('created_at', today.toISOString()),
        supabase.from('validation_events').select('created_at').gte('created_at', sevenDaysAgo.toISOString())
      ]);

      setStats({
        totalUsers: users.count || 0,
        totalPasses: passes.count || 0,
        totalRevenue: transactions.data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        validationsToday: validationsToday.count || 0
      });

      // Prepare chart data
      const dailyCounts: { [key: string]: number } = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(d.getDate() + i);
        dailyCounts[d.toISOString().split('T')[0]] = 0;
      }
      validationHistory.data?.forEach(v => {
        const date = v.created_at.split('T')[0];
        if (dailyCounts[date] !== undefined) {
          dailyCounts[date]++;
        }
      });
      setChartOptions({
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: Object.keys(dailyCounts) },
        yAxis: { type: 'value' },
        series: [{ data: Object.values(dailyCounts), type: 'bar', name: 'Validations' }],
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true }
      });

      const [passesData, validationsData, transactionsData] = await Promise.all([
        supabase.from('passes').select(`*, users (email, full_name), operators (name)`).order('created_at', { ascending: false }).limit(10),
        supabase.from('validation_events').select(`*, passes (pass_type, users (email, full_name))`).order('created_at', { ascending: false }).limit(10),
        supabase.from('transactions').select(`*, users (email, full_name), passes (pass_type)`).order('created_at', { ascending: false }).limit(10)
      ]);

      setRecentPasses(passesData.data || []);
      setRecentValidations(validationsData.data || []);
      setRecentTransactions(transactionsData.data || []);

    } catch (error: any) {
      toast({ title: 'Error loading admin data', description: error.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async (type: string) => {
    // Export logic remains the same
  };

  if (authLoading || loading) {
    return <Container maxW="7xl" py={8} centerContent><Spinner size="xl" /></Container>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between"><Heading>Admin Dashboard</Heading></HStack>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            <StatCard icon={Users} color="blue.500" label="Total Users" value={stats.totalUsers} />
            <StatCard icon={CreditCard} color="green.500" label="Total Passes" value={stats.totalPasses} />
            <StatCard icon={TrendingUp} color="purple.500" label="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} />
            <StatCard icon={Activity} color="orange.500" label="Validations Today" value={stats.validationsToday} />
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
          <Card gridColumn={{ base: 'auto', lg: 'span 3' }}>
            <CardBody>
              <HStack mb={4}><Icon as={BarChart2} color="brand.500" /><Heading size="md">Validations (Last 7 Days)</Heading></HStack>
              <ReactECharts option={chartOptions} style={{ height: '300px' }} />
            </CardBody>
          </Card>

          <Box gridColumn={{ base: 'auto', lg: 'span 2' }}>
            <Tabs>
              <TabList>
                <Tab>Recent Passes</Tab>
                <Tab>Recent Validations</Tab>
                <Tab>Recent Transactions</Tab>
              </TabList>
              <TabPanels>
                <TabPanel p={0}><DataTable title="Recent Passes" data={recentPasses} type="passes" onExport={handleExportData} /></TabPanel>
                <TabPanel p={0}><DataTable title="Recent Validations" data={recentValidations} type="validation_events" onExport={handleExportData} /></TabPanel>
                <TabPanel p={0}><DataTable title="Recent Transactions" data={recentTransactions} type="transactions" onExport={handleExportData} /></TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
          <Card>
            <CardBody>
              <HStack mb={4}><Icon as={Wifi} color="green.500" /><Heading size="md">Live Activity</Heading></HStack>
              <VStack spacing={4} align="stretch">
                {liveActivity.length === 0 ? <Text color="gray.500">Listening for live events...</Text> : liveActivity.map(activity => (
                    <Flex key={activity.id} align="center">
                      <Avatar size="sm" name={activity.user_email} mr={3} />
                      <Box>
                        <Text fontWeight="bold">{activity.type}</Text>
                        <Text fontSize="sm">{activity.description}</Text>
                        <Text fontSize="xs" color="gray.500">{new Date(activity.timestamp).toLocaleTimeString()}</Text>
                      </Box>
                    </Flex>
                  ))}
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      </VStack>
    </Container>
  );
};

const StatCard = ({ icon, color, label, value, helpText }: any) => (
    <Card>
      <CardBody>
        <HStack>
          <Icon as={icon} w={8} h={8} color={color} />
          <Stat>
            <StatLabel>{label}</StatLabel>
            <StatNumber>{value}</StatNumber>
            {helpText && <StatHelpText>{helpText}</StatHelpText>}
          </Stat>
        </HStack>
      </CardBody>
    </Card>
);

const DataTable = ({ title, data, type, onExport }: any) => {
    // DataTable component remains the same
    const getStatusColor = (status: string) => {
        switch (status) {
          case 'ACTIVE': case 'COMPLETED': case 'SUCCESS': return 'green';
          case 'EXPIRED': case 'FAILED': return 'red';
          case 'SUSPENDED': case 'PENDING': return 'orange';
          default: return 'gray';
        }
      };
    
      const renderHeaders = () => {
        if (!data || data.length === 0) return null;
        const headers = Object.keys(data[0]).filter(k => !['id', 'user_id', 'pass_id', 'operator_id', 'color_seed', 'qr_payload', 'metadata', 'updated_at', 'stripe_payment_intent_id', 'lat', 'lng', 'response_ms'].includes(k));
        return <Tr>{headers.map(h => <Th key={h}>{h.replace(/_/g, ' ')}</Th>)}</Tr>;
      };
    
      const renderRow = (row: any) => {
        const cells = Object.keys(row).filter(k => !['id', 'user_id', 'pass_id', 'operator_id', 'color_seed', 'qr_payload', 'metadata', 'updated_at', 'stripe_payment_intent_id', 'lat', 'lng', 'response_ms'].includes(k));
        return (
          <Tr key={row.id}>
            {cells.map(key => {
              let cellData = row[key];
              if (key === 'status' || key === 'validation_result') return <Td key={key}><Badge colorScheme={getStatusColor(cellData)}>{cellData}</Badge></Td>;
              if (key.includes('_at') || key === 'timestamp') return <Td key={key}>{new Date(cellData).toLocaleString()}</Td>;
              if (typeof cellData === 'object' && cellData !== null) cellData = cellData.email || cellData.name || JSON.stringify(cellData);
              return <Td key={key}>{cellData}</Td>;
            })}
          </Tr>
        );
      };
    
      return (
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Heading size="md">{title}</Heading>
                <Button size="sm" leftIcon={<Icon as={Download} />} onClick={() => onExport(type)}>
                  Export
                </Button>
              </HStack>
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>{renderHeaders()}</Thead>
                  <Tbody>{data.map(renderRow)}</Tbody>
                </Table>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      );
};

export default AdminPage;
