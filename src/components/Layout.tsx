import React from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  Button,
  useColorModeValue,
  HStack,
  Text,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useToast,
  Image
} from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ChevronDownIcon } from '@chakra-ui/icons';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      toast({
        title: 'Signed out successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error signing out',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box minH="100vh">
      {/* Header */}
      <Box bg={bg} borderBottom="1px" borderColor={borderColor} px={4} py={3}>
        <Container maxW="7xl">
          <Flex justify="space-between" align="center">
            <Link to="/">
              <HStack spacing={3}>
                <Image 
                  src="/TGSRTC_logo_1_84315be041.webp" 
                  alt="TGSRTC Logo" 
                  h="40px" 
                  w="40px" 
                  objectFit="contain"
                />
                <Heading size="lg" color="brand.600">
                  SUMAP
                </Heading>
              </HStack>
            </Link>

            <HStack spacing={4}>
              {user ? (
                <>
                  <Link to="/dashboard">
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                  <Link to="/validator">
                    <Button variant="ghost">Validator</Button>
                  </Link>
                  
                  <Menu>
                    <MenuButton as={Button} rightIcon={<ChevronDownIcon />} variant="ghost">
                      <HStack>
                        <Avatar size="sm" name={user.user_metadata?.full_name || user.email || 'User'} />
                        <Text>{user.user_metadata?.full_name || user.email}</Text>
                      </HStack>
                    </MenuButton>
                    <MenuList>
                      <MenuItem onClick={() => navigate('/dashboard')}>
                        My Passes
                      </MenuItem>
                       <MenuItem onClick={() => navigate('/profile')}>
                        My Profile
                      </MenuItem>
                      <MenuItem onClick={() => navigate('/admin')}>
                        Admin Panel
                      </MenuItem>
                      <MenuDivider />
                      <MenuItem onClick={handleSignOut}>
                        Sign Out
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </>
              ) : (
                <Link to="/login">
                  <Button colorScheme="brand">Sign In</Button>
                </Link>
              )}
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Box as="main" flex="1">
        {children}
      </Box>

      {/* Footer */}
      <Box bg={bg} borderTop="1px" borderColor={borderColor} py={6} mt={12}>
        <Container maxW="7xl">
          <Text textAlign="center" color="gray.600">
            © 2025 SUMAP - Smart Unified Mobility & Access Platform. All rights reserved.
          </Text>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
