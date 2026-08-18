import { Button, FormControl, FormLabel, InputGroup, InputRightElement, VStack } from '@chakra-ui/react'
import { Input } from '@chakra-ui/react'
import React, { useState } from 'react'
import { useToast } from '@chakra-ui/react'
import axios from 'axios';
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min'
import { ChatState } from '../../Context/ChatProvider';

const Signup = () => {
    const [show,setShow]=useState(false)
    const [name,setName]=useState();
    const [email,setEmail]=useState();
    const [confirmpassword,setConfirmpassword]=useState();
    const [password,setPassword]=useState();
    const [pic,setPic]=useState();
    const [loading,setLoading]=useState(false);
    const toast = useToast()
    const history=useHistory();
    const { setUser, setSelectedChat, setChats, setNotification } = ChatState();

    const handleClick=()=>{
        setShow(!show);
    }
    const postDetails = (pics) => {
      console.log("Received:", pics); 
    
      setLoading(true);
    
      if (!pics) {
        toast({
          title: "Please Select an Image",
          status: "warning",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
        setLoading(false);
        return;
      }
    
      if (pics.type === "image/jpeg" || pics.type === "image/png") {
        const data = new FormData();
        data.append("file", pics);
        data.append("upload_preset", "chat-app");
        data.append("cloud_name", "doi8szlnw");
    
        fetch("https://api.cloudinary.com/v1_1/doi8szlnw/image/upload", {
          method: "POST",
          body: data,
        })
          .then((res) => res.json())
          .then((data) => {
            setPic(data.url.toString());
            console.log(data.url.toString());
            setLoading(false);
          })
          .catch((err) => {
            console.error("Upload failed:", err);
            setLoading(false);
          });
      } else {
        toast({
          title: "Please Select a JPEG or PNG Image",
          status: "warning",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
        setLoading(false);
      }
    };
    
    
    const submitHandler = async () => {
      setLoading(true);
    
      if (!name || !email || !password || !confirmpassword) {
        toast({
          title: "Please Fill All Fields",
          status: "warning",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
        setLoading(false);
        return;
      }
    
      if (password !== confirmpassword) {
        toast({
          title: "Passwords do not match",
          status: "warning",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
        setLoading(false);
        return;
      }
    
      try {
        const config = {
          headers: {
            "Content-type": "application/json",
          },
        };
    
        const { data } = await axios.post(
          "/api/user", // Make sure proxy is set in package.json
          {
            name,
            email,
            password,
            pic,
          },
          config
        );
    
        console.log("Response from backend:", data);
    
        toast({
          title: "Registration Successful",
          status: "success",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
    
        localStorage.setItem("userInfo", JSON.stringify(data));
        setUser(data);
        setSelectedChat(null);
        setChats([]);
        setNotification([]);
        setLoading(false);
        history.push("/chats");
      } catch (error) {
        toast({
          title: "Error Occurred",
          description: error.response.data.message || error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
        setLoading(false);
      }
    };
    
  return (
      <VStack spacing="5px" color="black">
        <FormControl id="first-name" isRequired>
            <FormLabel>Name</FormLabel>
            <Input 
              placeholder="Enter Your Name"
              onChange={(e)=>{
                setName(e.target.value);
              }}
            />
        </FormControl>
        <FormControl id="email" isRequired>
            <FormLabel>Email Address</FormLabel>
            <Input 
              placeholder="Enter Your Email"
              onChange={(e)=>{
                setEmail(e.target.value);
              }}
            />
        </FormControl>
        <FormControl id="password" isRequired>
            <FormLabel>Password</FormLabel>
            <InputGroup size="md">
            <Input 
              type={show?"text":"password"}
              placeholder="Enter Password"
              onChange={(e)=>{
                setPassword(e.target.value);
              }}
            />
            <InputRightElement width="4.5rem">
               <Button h="1.75rem" size="sm" onClick={handleClick}>
                  {show?"Hide":"Show"}
               </Button>
            </InputRightElement >
           </InputGroup>
        </FormControl>
        <FormControl id="password" isRequired>
            <FormLabel>Confirm Password</FormLabel>
            <InputGroup size="md">
            <Input 
              type={show?"text":"password"}
              placeholder="Confirm Password"
              onChange={(e)=>{
                setConfirmpassword(e.target.value);
              }}
            />
            <InputRightElement width="4.5rem">
               <Button h="1.75rem" size="sm" onClick={handleClick}>
                  {show?"Hide":"Show"}
               </Button>
            </InputRightElement>
           </InputGroup>
        </FormControl>
        <FormControl id="pic">
           <FormLabel>Upload your Picture</FormLabel>
           <Input
            type="file"
            p={1.5}
            accept="image/*"
            onChange={(e)=>postDetails(e.target.files[0])}
           />
        </FormControl>
        <Button
          colorScheme='blue'
          width="100%"
          style={{marginTop:15}}
          onClick={submitHandler}
          isLoading={loading}
        >
            Sign Up
        </Button>
      </VStack>
       
  )
}

export default Signup
