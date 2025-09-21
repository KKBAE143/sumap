import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Icon,
  SimpleGrid,
  Image,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { ArrowRight, Download, CreditCard, ScanLine, Bus, TramFront, ShieldCheck, WifiOff, Bell, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);
const MotionButton = motion(Button);

const HeroSection: React.FC = () => {
  const { user } = useAuth();
  const bgOverlay = useColorModeValue('rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.6)');
  const [videoError, setVideoError] = React.useState(false);

  const handleVideoError = () => {
    console.log('Video failed to load, using fallback background');
    setVideoError(true);
  };

  return (
    <Box
      as="section"
      position="relative"
      h={{ base: 'auto', md: '100vh' }}
      minH={{ base: '80vh', md: '700px' }}
      overflow="hidden"
    >
      {/* Video Background or Fallback */}
      {!videoError ? (
        <Box
          as="video"
          position="absolute"
          top="0"
          left="0"
          w="100%"
          h="100%"
          objectFit="cover"
          autoPlay
          muted
          loop
          playsInline
          zIndex={0}
          preload="metadata"
          onError={handleVideoError}
          poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'%3E%3Crect width='1920' height='1080' fill='%23000'/%3E%3C/svg%3E"
        >
          <source src="/3405803-hd_1920_1080_30fps.mp4" type="video/mp4" />
        </Box>
      ) : (
        <Box
          position="absolute"
          top="0"
          left="0"
          w="100%"
          h="100%"
          bgGradient="linear(to-br, brand.600, brand.800, purple.600)"
          zIndex={0}
        />
      )}
      
      {/* Overlay */}
      <Box position="absolute" top="0" left="0" right="0" bottom="0" bg={bgOverlay} zIndex={1} />
      
      <Container maxW="7xl" h="full" position="relative" zIndex={2}>
        <Flex
          direction="column"
          align="center"
          justify="center"
          h="full"
          py={{ base: 20, md: 0 }}
          textAlign="center"
        >
          <VStack spacing={8} maxW="4xl">
            <MotionBox
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Heading 
                as="h1" 
                size={{ base: '3xl', md: '4xl' }} 
                color="white"
                fontWeight="bold"
                lineHeight="1.2"
                textShadow="2px 2px 4px rgba(0,0,0,0.3)"
              >
                Transform Your Urban Journey
              </Heading>
            </MotionBox>
            
            <MotionBox
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Text 
                fontSize={{ base: 'xl', md: '2xl' }} 
                color="gray.100"
                maxW="3xl"
                lineHeight="1.6"
                textShadow="1px 1px 2px rgba(0,0,0,0.5)"
              >
                Experience seamless mobility across the city with SUMAP - your digital gateway to buses, metro, trams, and more.
              </Text>
            </MotionBox>

            <MotionBox
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <HStack spacing={6} pt={6} flexWrap="wrap" justify="center">
                <MotionButton
                  as={Link}
                  to={user ? '/dashboard' : '/login'}
                  colorScheme="brand"
                  size="lg"
                  px={8}
                  py={6}
                  fontSize="lg"
                  rightIcon={<ArrowRight />}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  boxShadow="0 8px 25px rgba(34, 197, 94, 0.3)"
                  _hover={{
                    boxShadow: "0 12px 35px rgba(34, 197, 94, 0.4)",
                  }}
                >
                  Start Your Journey
                </MotionButton>
                <MotionButton
                  variant="outline"
                  size="lg"
                  px={8}
                  py={6}
                  fontSize="lg"
                  color="white"
                  borderColor="white"
                  _hover={{
                    bg: "whiteAlpha.200",
                    borderColor: "white",
                  }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Watch Demo
                </MotionButton>
              </HStack>
            </MotionBox>

            {/* Feature highlights */}
            <MotionBox
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              pt={8}
            >
              <HStack 
                spacing={8} 
                color="gray.200" 
                fontSize="sm"
                flexWrap="wrap"
                justify="center"
              >
                <HStack spacing={2}>
                  <Icon as={ShieldCheck} w={5} h={5} color="brand.400" />
                  <Text>Secure & Reliable</Text>
                </HStack>
                <HStack spacing={2}>
                  <Icon as={Bus} w={5} h={5} color="brand.400" />
                  <Text>Multi-Modal Access</Text>
                </HStack>
                <HStack spacing={2}>
                  <Icon as={WifiOff} w={5} h={5} color="brand.400" />
                  <Text>Works Offline</Text>
                </HStack>
              </HStack>
            </MotionBox>
          </VStack>
        </Flex>
      </Container>
    </Box>
  );
};

const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      icon: Download,
      title: 'Download & Sign Up',
      description: 'Get the app from the App Store or Google Play and create your account in minutes.',
    },
    {
      icon: CreditCard,
      title: 'Purchase Your Pass',
      description: 'Choose from a variety of passes and pay securely with your preferred payment method.',
    },
    {
      icon: ScanLine,
      title: 'Scan & Go',
      description: 'Simply scan your dynamic QR code at any entry point to start your journey.',
    },
  ];

  return (
    <Box as="section" bg={useColorModeValue('gray.50', 'gray.800')} py={20}>
      <Container maxW="7xl">
        <VStack spacing={12}>
          <Heading as="h2" size="xl" textAlign="center">
            How It Works
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
            {steps.map((step, index) => (
              <VStack key={index} spacing={4} textAlign="center">
                <Flex
                  w={16}
                  h={16}
                  align="center"
                  justify="center"
                  rounded="full"
                  bg="brand.100"
                  color="brand.600"
                >
                  <Icon as={step.icon} w={8} h={8} />
                </Flex>
                <Heading as="h3" size="md">{step.title}</Heading>
                <Text color="gray.600">{step.description}</Text>
              </VStack>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

const FeaturesSection: React.FC = () => {
    const features = [
      { icon: Bus, title: 'Multi-modal Access', description: 'One pass for buses, metro, trams, and more.' },
      { icon: ShieldCheck, title: 'Secure Payments', description: 'Enterprise-grade security for all transactions.' },
      { icon: Bell, title: 'Real-time Updates', description: 'Get instant notifications about your pass and services.' },
      { icon: WifiOff, title: 'Offline Mode', description: 'Validate your pass even without an internet connection.' },
      { icon: TramFront, title: 'Operator Integration', description: 'Easily integrates with various transport operators.' },
      { icon: Star, title: 'Loyalty & Rewards', description: 'Earn points and rewards for your regular commutes.' },
    ];
  
    return (
      <Box as="section" py={20}>
        <Container maxW="7xl">
          <VStack spacing={12}>
            <Heading as="h2" size="xl" textAlign="center">
              Why Choose SUMAP?
            </Heading>
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={10}>
              {features.map((feature, index) => (
                <HStack key={index} align="start" spacing={4}>
                  <Icon as={feature.icon} w={8} h={8} color="brand.500" />
                  <VStack align="start">
                    <Heading as="h3" size="md">{feature.title}</Heading>
                    <Text color="gray.600">{feature.description}</Text>
                  </VStack>
                </HStack>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>
    );
};

const PartnersSection: React.FC = () => {
    const logos = [
      { name: 'Hyderabad Metro Rail', url: '/metro.png' },
      { name: 'Telangana State RTC', url: '/rtc.png' },
      { name: 'Capital Transit', url: '/3.png' },
      { name: 'Regional Rail', url: '/4.png' },
      { name: 'Shuttle Corp', url: '/5.png' },
    ];
  
    return (
      <Box as="section" bg={useColorModeValue('gray.50', 'gray.800')} py={24}>
        <Container maxW="6xl">
          <VStack spacing={12}>
            <VStack spacing={4}>
              <Heading 
                as="h2" 
                size="xl" 
                color={useColorModeValue('gray.700', 'gray.200')} 
                fontWeight="bold"
                textAlign="center"
              >
                Trusted by leading transport operators
              </Heading>
              <Text 
                color={useColorModeValue('gray.600', 'gray.400')} 
                fontSize="lg"
                textAlign="center"
                maxW="2xl"
              >
                Join the network of forward-thinking transport operators who trust SUMAP for their digital mobility solutions
              </Text>
            </VStack>
            
            <Box
              w="full"
              bg={useColorModeValue('white', 'gray.700')}
              borderRadius="2xl"
              p={8}
              shadow="lg"
              border="1px"
              borderColor={useColorModeValue('gray.200', 'gray.600')}
            >
              <SimpleGrid
                columns={{ base: 2, sm: 3, md: 5 }}
                spacing={8}
                alignItems="center"
                justifyItems="center"
              >
                {logos.map((logo, index) => (
                  <MotionBox
                    key={logo.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ 
                      scale: 1.1,
                      filter: 'grayscale(0%)',
                      transition: { duration: 0.3 }
                    }}
                    cursor="pointer"
                    p={4}
                    borderRadius="lg"
                    _hover={{
                      bg: useColorModeValue('gray.50', 'gray.600'),
                      shadow: 'md'
                    }}
                  >
                    <Image 
                      src={logo.url} 
                      alt={logo.name} 
                      h={{ base: "35px", md: "45px" }}
                      maxW="120px"
                      objectFit="contain"
                      filter="grayscale(70%)"
                      transition="all 0.3s ease"
                      _hover={{
                        filter: 'grayscale(0%)'
                      }}
                    />
                  </MotionBox>
                ))}
              </SimpleGrid>
            </Box>
            
            <HStack spacing={4} color={useColorModeValue('gray.500', 'gray.400')}>
              <Text fontSize="sm" fontWeight="medium">
                Powering 500K+ daily journeys
              </Text>
              <Box w="1px" h="4" bg="gray.300" />
              <Text fontSize="sm" fontWeight="medium">
                99.9% uptime reliability
              </Text>
              <Box w="1px" h="4" bg="gray.300" />
              <Text fontSize="sm" fontWeight="medium">
                Trusted since 2024
              </Text>
            </HStack>
          </VStack>
        </Container>
      </Box>
    );
};

const CTASection: React.FC = () => {
    return (
      <Box as="section" py={20}>
        <Container maxW="4xl">
          <VStack spacing={6} textAlign="center">
            <Heading as="h2" size="2xl" color="brand.800">
              Ready to Simplify Your Commute?
            </Heading>
            <Text fontSize="lg" color="gray.600">
              Download the SUMAP app today and experience the future of urban mobility.
            </Text>
            <HStack spacing={4} pt={4}>
                <Image h="50px" src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Download_on_the_App_Store_Badge.svg/2560px-Download_on_the_App_Store_Badge.svg.png" alt="Download on the App Store" />
                <Image h="50px" src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Google_Play_Store_badge_EN.svg/2560px-Google_Play_Store_badge_EN.svg.png" alt="Get it on Google Play" />
            </HStack>
          </VStack>
        </Container>
      </Box>
    );
};
  

const HomePage: React.FC = () => {
  return (
    <Box>
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <PartnersSection />
      <CTASection />
    </Box>
  );
};

export default HomePage;
