import React, { useState } from 'react';
import {
  Container,
  Heading,
  VStack,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    
    try {
      const { error } = await user?.update({
        data: { full_name: fullName }
      });
      
      if (error) throw error;
      
      toast({
        title: 'Profile updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Error updating profile',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setUpdating(true);
    
    try {
      const { error } = await user?.update({ password });
      
      if (error) throw error;
      
      toast({
        title: 'Password updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'Error updating password',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading) {
    return <Container centerContent py={10}><Heading>Loading...</Heading></Container>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Container maxW="lg" py={12}>
      <VStack spacing={8}>
        <Heading>My Profile</Heading>
        <Card w="full">
          <CardBody>
            <Tabs isFitted>
              <TabList>
                <Tab>Personal Info</Tab>
                <Tab>Change Password</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <form onSubmit={handleUpdateProfile}>
                    <VStack spacing={4}>
                      <FormControl>
                        <FormLabel>Email</FormLabel>
                        <Input value={user.email} isReadOnly />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Full Name</FormLabel>
                        <Input
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Your full name"
                        />
                      </FormControl>
                      <Button
                        type="submit"
                        colorScheme="brand"
                        w="full"
                        isLoading={updating}
                        loadingText="Updating..."
                      >
                        Update Profile
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>
                <TabPanel>
                  <form onSubmit={handleUpdatePassword}>
                    <VStack spacing={4}>
                      <FormControl>
                        <FormLabel>New Password</FormLabel>
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter a new strong password"
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Confirm New Password</FormLabel>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm your new password"
                        />
                      </FormControl>
                      <Button
                        type="submit"
                        colorScheme="brand"
                        w="full"
                        isLoading={updating}
                        loadingText="Updating..."
                      >
                        Update Password
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default ProfilePage;
