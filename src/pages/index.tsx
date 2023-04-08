import Head from "next/head";
import Image from "next/image";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import {utf8ToHex, numberToHex} from '@walletconnect/encoding'
import { Ref, useEffect, useRef, useState } from "react";
import axios from "axios";
import {ethers} from 'ethers'



export default function Home() {
  //styles
  const inputStyle = {
    fontFamily: "Arial, sans-serif",
    fontSize: "16px",
    padding: "12px 20px",
    margin: "auto",
    border: "none",
    borderRadius: "25px",
    boxShadow:
      "0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08)",
    outline: "none",
    width: "300px",
    marginBottom: "20px",
    backgroundColor: "#F8F8F8",
    color: "#333",
  };

  const connectStyle = {
    fontFamily: "Arial, sans-serif",
    fontSize: "16px",
    padding: "12px 20px",
    margin: "auto",
    border: "none",
    borderRadius: "25px",
    boxShadow:
      "0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08)",
    outline: "none",
    cursor: "pointer",
    backgroundColor: "#4B73FF",
    color: "#FFF",
    transition: "background-color 0.2s",
  };

  const reqStyle = {
    fontFamily: "Arial, sans-serif",
    fontSize: "16px",
    padding: "12px 20px",
    marginBottom: "10px",
    marginLeft: "auto",
    marginRight: "auto",
    border: "none",
    borderRadius: "25px",
    boxShadow:
      "0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08)",
    outline: "none",
    cursor: "pointer",
    backgroundColor: "#4B73FF",
    color: "#FFF",
    transition: "background-color 0.2s",
  };

  const titleStyle = {
    fontFamily: "Montserrat, sans-serif",
    fontSize: "56px",
    fontWeight: 700,
    marginBottom: "25px",
    color: "transparent",
    backgroundImage: "linear-gradient(90deg, #4B73FF, #3A5AD8)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    display: "inline",
  };


  const guardCode = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState<Boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);


  // connection request
  const connectRequest = async () => {
    setLoading(true);
    if (guardCode?.current?.value && !connected) {
      try {

        //call altura api to send the guard code from the user
        const result: { data: {token: string, address: string} } = (await axios.get(
          "/api/sendRequest?guardCode=" +
            guardCode.current.value
        )).data;

        //set the token and address
        //the token is used to send requests
        //you should store a users token in a database
        //user can revoke this at any point and so can you via the altura api 
        setToken(result.data.token);
        setAddress(result.data.address);
        setConnected(true);
        
        
      } catch (e: any) {
        console.log(e.response.data);
        alert("Failed to send request. Error: " + JSON.stringify(e.response.data.message));
      }
    }
    setLoading(false);
  };

  async function pollForResponse(requestId: string) {
    let responseStatus = 204;
    var result = null;
    while (responseStatus === 204) {
      result = await axios.post(
        `${process.env.NEXT_PUBLIC_ALTURA_API}/api/alturaguard/getResponse`,
        {
          token,
          requestId
        }
      );
      
      responseStatus = result.status;
      
      if (responseStatus === 204) {
        // Wait for 10 seconds before making the next request
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  
    // Once the response status is not 204, return the result
    return result?.data;
  }

  //sign transaction request
  const signMessageRequest = async () => {
    setLoading(true);
    if (connected && address && token) {
    //encode the message
    const message = utf8ToHex("Altura Guard II Sign Message Demo", true);
    try {
    const request: {data: {requestId: string}} = await axios.post(
      `${process.env.NEXT_PUBLIC_ALTURA_API}/api/alturaguard/request`,
      {
        token: token,
        reqParameters: [
          "signature",
          message
        ],
      }
    );
    
    //expires after 10 minutes and returns 404: invalid request id
    const result = await pollForResponse(request.data.requestId);

    if (result != "Rejected")
    alert("Success, signature: " + result);
  else
    alert("Rejected");
  } catch (e:any) {
    console.log(e);
    //expired
    alert("Rejected");
    setLoading(false);
  }
  }
    setLoading(false);
  };

  //send transaction request
  const sendETHTransactionRequest = async () => {
    setLoading(true);
    if (connected && address && token) {
    //encode the amount to send
    // 0.1 TBNB = 10000000000000000
    const amountToSend = BigInt("10000000000000000");
    //get the user address
    const userAddress = address;
    try {

    const request: {data: {requestId: string}} = await axios.post(
      `${process.env.NEXT_PUBLIC_ALTURA_API}/api/alturaguard/request`,
      {
        token: token,
        reqParameters: [
          "transaction",
          {
            //from: userAddress,
            //to: who to send the tx to (burn address in this case)
            //data: data to send with the tx (0x for just eth transfers)
            //value: amount to send in hex
            from: userAddress,
            to: "0x0000000000000000000000000000000000000000",
            data: "0x",
            value: "0x" + amountToSend.toString(16),
          },
          97, //chain id
        ],
      }
    );
    
    //in a real situation, should give up after a certain amount of time
    const result = await pollForResponse(request.data.requestId);
    if (result != "Rejected")
      alert("Success, hash: " + result);
    else
      alert("Rejected");
  } catch (e:any) {
    console.log(e);
    alert(e.message);
    setLoading(false);
  }
  }
    setLoading(false);
  };

  //interact with a smart contract
  //in this example we will interact with BUSD on BSC Testnet and Approve 0.1 BUSD
  const sendContractTransactionRequest = async () => {
    setLoading(true);
    if (connected && token && address) {
    //get the user address
    const userAddress = address;

    //create the tx object
    //BUSD contract address: 0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7
    const contractAddress = '0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7';
    //Approve function ABI
    const abi = [{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}];
    const contract = new ethers.Contract(contractAddress, abi);

    // Set the parameters for the transaction
    const spender = userAddress; // the address of the spender
    const amount = ethers.parseEther('0.1'); // the amount to approve

    try {
    const request: {data: {requestId: string}} = await axios.post(
      `${process.env.NEXT_PUBLIC_ALTURA_API}/api/alturaguard/request`,
      {
        token: token,
        reqParameters: [
          "transaction",
          {
            //from: userAddress,
            //to: who to send the tx to (conttract address in this case)
            //data: data to send with the tx (using the contract interface to encode the function data)
            //value: amount to send in hex (0 as we're sending 0 native tokens)
            from: userAddress,
            to: contractAddress,
            data: contract.interface.encodeFunctionData('approve', [spender, amount]),
            value: "0x0",
          },
          97, //chain id
        ],
      }
    );
    
    //in a real situation, should give up after a certain amount of time
    const result = await pollForResponse(request.data.requestId);
    if (result != "Rejected")
      alert("Success, hash: " + result);
    else
      alert("Rejected");

  } catch (e:any) {
    console.log(e);
    alert(e.message);
    setLoading(false);
  }
  }
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Altura Guard II Demo</title>
        <meta
          name="description"
          content="Demo showcasing how to integrate Altura Guard II using the Altura API"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main
        style={{
          backgroundColor: "black",
          height: "100vh",
          maxHeight: "100vh",
          overflow: "hidden",
          alignContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
            paddingBottom: "50%",
            textAlign: "center",
          }}
        >
          <h1 style={titleStyle}>Altura Guard Demo</h1>
          {!connected ? (
            <>
              {" "}
              <input
                type="text"
                id="alturaGuardCode"
                name="alturaGuardCode"
                placeholder="Altura Guard Code"
                ref={guardCode}
                style={inputStyle}
              />
              <button
                disabled={ loading}
                onClick={connectRequest}
                style={connectStyle}
              >
                {" "}
                {!loading ? "Connect" : "Requesting..."}
              </button>
            </>
          ) : (
            <>
            <span style={{color: "green", fontWeight: 700, marginBottom: "1px"}} >Connected</span>
            <span style={{color: "white", fontWeight: 700, marginBottom: "20px", fontSize: "10"}} >{address || "Unknown"}</span>
              <button
                disabled={loading}
                onClick={signMessageRequest}
                style={reqStyle}
              >
                {" "}
                {!loading ? "Sign Message" : "Requesting..."}
              </button>
              <button
                disabled={loading}
                onClick={sendETHTransactionRequest}
                style={reqStyle}
              >
                {" "}
                {!loading ? "Send 0.01 TBNB" : "Requesting..."}
              </button>
              <button
                disabled={loading}
                onClick={sendContractTransactionRequest}
                style={reqStyle}
              >
                {" "}
                {!loading ? "Approve 0.1 BUSD" : "Requesting..."}
              </button>
            </>
          )}
        </div>
      </main>
    </>
  );
}
