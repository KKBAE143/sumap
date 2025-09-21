import React, { useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardBody,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Link as ChakraLink,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  HStack,
  PinInput,
  PinInputField
} from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const { signIn, signUp, signInWithOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Email/Password form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // OTP state
  const [otp, setOtp] = useState('');

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await signIn(email, password);
      toast({
        title: 'Welcome back!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Sign in failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await signUp(email, password, fullName);
      toast({
        title: 'Account created successfully!',
        description: 'Please check your email to verify your account.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Sign up failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await signInWithOTP(phoneNumber);
      setShowOTPInput(true);
      toast({
        title: 'OTP sent!',
        description: 'Please check your SMS for the verification code.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to send OTP',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerification = async () => {
    if (otp.length !== 6) return;
    
    setIsLoading(true);
    try {
      await verifyOTP(phoneNumber, otp);
      toast({
        title: 'Phone verified successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'OTP verification failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="md" py={12}>
      <Card>
        <CardBody>
          <VStack spacing={6}>
            <Heading textAlign="center" color="brand.600">
              Welcome to SUMAP
            </Heading>
            
            <Tabs isFitted w="full">
              <TabList>
                <Tab>Sign In</Tab>
                <Tab>Sign Up</Tab>
                <Tab>Phone OTP</Tab>
              </TabList>
              
              <TabPanels>
                {/* Sign In Tab */}
                <TabPanel>
                  <form onSubmit={handleEmailSignIn}>
                    <VStack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Email</FormLabel>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Password</FormLabel>
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                        />
                      </FormControl>
                      
                      <Button
                        type="submit"
                        colorScheme="brand"
                        w="full"
                        isLoading={isLoading}
                        loadingText="Signing in..."
                      >
                        Sign In
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>
                
                {/* Sign Up Tab */}
                <TabPanel>
                  <form onSubmit={handleEmailSignUp}>
                    <VStack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Full Name</FormLabel>
                        <Input
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Enter your full name"
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Email</FormLabel>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Password</FormLabel>
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Choose a strong password"
                        />
                      </FormControl>
                      
                      <Button
                        type="submit"
                        colorScheme="brand"
                        w="full"
                        isLoading={isLoading}
                        loadingText="Creating account..."
                      >
                        Create Account
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>
                
                {/* Phone OTP Tab */}
                <TabPanel>
                  {!showOTPInput ? (
                    <form onSubmit={handlePhoneSignIn}>
                      <VStack spacing={4}>
                        <FormControl isRequired>
                          <FormLabel>Phone Number</FormLabel>
                          <Input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+91 9876543210"
                          />
                        </FormControl>
                        
                        <Button
                          type="submit"
                          colorScheme="brand"
                          w="full"
                          isLoading={isLoading}
                          loadingText="Sending OTP..."
                        >
                          Send OTP
                        </Button>
                      </VStack>
                    </form>
                  ) : (
                    <VStack spacing={4}>
                      <Text textAlign="center">
                        Enter the 6-digit code sent to {phoneNumber}
                      </Text>
                      
                      <HStack>
                        <PinInput value={otp} onChange={setOtp} onComplete={handleOTPVerification}>
                          <PinInputField />
                          <PinInputField />
                          <PinInputField />
                          <PinInputField />
                          <PinInputField />
                          <PinInputField />
                        </PinInput>
                      </HStack>
                      
                      <Button
                        colorScheme="brand"
                        w="full"
                        isLoading={isLoading}
                        loadingText="Verifying..."
                        onClick={handleOTPVerification}
                        isDisabled={otp.length !== 6}
                      >
                        Verify OTP
                      </Button>
                      
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowOTPInput(false);
                          setOtp('');
                        }}
                      >
                        Change Phone Number
                      </Button>
                    </VStack>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
            
            <Text textAlign="center" fontSize="sm" color="gray.600">
              By continuing, you agree to our{' '}
              <ChakraLink as={Link} to="/terms" color="brand.500">
                Terms of Service
              </ChakraLink>{' '}
              and{' '}
              <ChakraLink as={Link} to="/privacy" color="brand.500">
                Privacy Policy
              </ChakraLink>
            </Text>
          </VStack>
        </CardBody>
      </Card>
    </Container>
  );
};

export default LoginPage;
