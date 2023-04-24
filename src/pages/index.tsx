import Head from "next/head";
import { utf8ToHex } from "@walletconnect/encoding";
import { useRef, useState } from "react";
import axios from "axios";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import Image from "next/image";
import { FcCheckmark } from "react-icons/fc";
import { FiCopy } from "react-icons/fi";
import styled, { css } from "styled-components";

export const Button = styled.button<{
  block?: boolean;
  $loading?: boolean;
}>`
  position: relative;
  display: inline-block;
  border-radius: 2rem;
  padding: 12px 20px;
  transition: 0.3s all;
  background-color: #4b73ff;
  color: #fff;
  font-weight: 500;
  border: none;
  box-shadow: none;
  outline: none;

  ${(props) =>
    props.$loading &&
    css`
      opacity: 0.4;
      pointer-events: none;

      &:after {
        content: "";
        position: absolute;
        width: 20px;
        height: 20px;
        top: 0;
        left: 12px;
        bottom: 0;
        margin: auto;
        border: 2px solid transparent;
        border-top-color: #ffffff;
        border-radius: 50%;
        animation: button-loading-spinner 1s ease infinite;
      }
    `};

  ${(props) =>
    props.block &&
    css`
      width: 100%;
    `};

  ${(props) =>
    props.$loading &&
    !props.block &&
    css`
      padding-left: 40px;
    `};
`;

export default function Home() {
  const guardCode = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState<Boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [sending, setSending] = useState(false);
  const [approving, setApproving] = useState(false);

  // connection request
  const connectRequest = async () => {
    if (!guardCode?.current?.value) {
      toast.warning("Please enter Altura guard code.");
      return;
    }

    if (guardCode?.current?.value && !connected) {
      setLoading(true);
      try {
        // call altura api to send the guard code from the user
        const result: { data: { token: string; address: string } } = (
          await axios.get(
            "/api/sendRequest?guardCode=" + guardCode.current.value
          )
        ).data;

        // set the token and address
        // the token is used to send requests
        // you should store a users token in a database
        // user can revoke this at any point and so can you via the altura api
        setToken(result.data.token);
        setAddress(result.data.address);
        setConnected(true);
      } catch (e: any) {
        toast.error(
          "Failed to send request. Error: " +
            JSON.stringify(e.response.data.message)
        );
      }
      setLoading(false);
    }
  };

  const pollForResponse = async (requestId: string) => {
    let responseStatus = 204;
    let result = null;
    while (responseStatus === 204) {
      result = await axios.post(
        `${process.env.NEXT_PUBLIC_ALTURA_API}/api/alturaguard/getResponse`,
        {
          token,
          requestId,
        }
      );

      responseStatus = result.status;

      if (responseStatus === 204) {
        // Wait for 10 seconds before making the next request
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }

    // Once the response status is not 204, return the result
    return result?.data;
  };

  // sign transaction request
  const signMessageRequest = async () => {
    if (connected && address && token) {
      setSigning(true);
      // encode the message
      const message = utf8ToHex("Altura Guard II Sign Message Demo", true);
      try {
        const request: { data: { requestId: string } } = await axios.post(
          `${process.env.NEXT_PUBLIC_ALTURA_API}/api/alturaguard/request`,
          {
            token: token,
            reqParameters: ["signature", message],
          }
        );

        // expires after 10 minutes and returns 404: invalid request id
        const result = await pollForResponse(request.data.requestId);

        if (result != "Rejected") {
          toast.success("Success, signature: " + result);
        } else {
          toast.error("Rejected");
        }
      } catch (e: any) {
        // expired
        toast.error("Rejected");
      }
      setSigning(false);
    }
  };

  // send transaction request
  const sendETHTransactionRequest = async () => {
    if (connected && address && token) {
      setSending(true);
      // encode the amount to send
      // 0.1 TBNB = 10000000000000000
      const amountToSend = BigInt("10000000000000000");
      // get the user address
      const userAddress = address;
      try {
        const request: { data: { requestId: string } } = await axios.post(
          `${process.env.NEXT_PUBLIC_ALTURA_API}/api/alturaguard/request`,
          {
            token: token,
            reqParameters: [
              "transaction",
              {
                // from: userAddress,
                // to: who to send the tx to (burn address in this case)
                // data: data to send with the tx (0x for just eth transfers)
                // value: amount to send in hex
                from: userAddress,
                to: "0x0000000000000000000000000000000000000000",
                data: "0x",
                value: "0x" + amountToSend.toString(16),
              },
              97, // chain id
            ],
          }
        );

        // in a real situation, should give up after a certain amount of time
        const result = await pollForResponse(request.data.requestId);
        if (result != "Rejected") {
          toast.success("Success, hash: " + result);
        } else {
          toast.error("Rejected");
        }
      } catch (e: any) {
        console.log(e);
        toast.error(e.message);
      }
      setSending(false);
    }
  };

  // interact with a smart contract
  // in this example we will interact with BUSD on BSC Testnet and Approve 0.1 BUSD
  const sendContractTransactionRequest = async () => {
    if (connected && token && address) {
      setApproving(true);
      // get the user address
      const userAddress = address;

      // create the tx object
      // BUSD contract address: 0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7
      const contractAddress = "0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7";
      // Approve function ABI
      const abi = [
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" },
          ],
          name: "approve",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function",
        },
      ];
      const contract = new ethers.Contract(contractAddress, abi);

      // Set the parameters for the transaction
      const spender = userAddress; // the address of the spender
      const amount = ethers.parseEther("0.1"); // the amount to approve

      try {
        const request: { data: { requestId: string } } = await axios.post(
          `${process.env.NEXT_PUBLIC_ALTURA_API}/api/alturaguard/request`,
          {
            token: token,
            reqParameters: [
              "transaction",
              {
                // from: userAddress,
                // to: who to send the tx to (conttract address in this case)
                // data: data to send with the tx (using the contract interface to encode the function data)
                // value: amount to send in hex (0 as we're sending 0 native tokens)
                from: userAddress,
                to: contractAddress,
                data: contract.interface.encodeFunctionData("approve", [
                  spender,
                  amount,
                ]),
                value: "0x0",
              },
              97, // chain id
            ],
          }
        );

        // in a real situation, should give up after a certain amount of time
        const result = await pollForResponse(request.data.requestId);
        if (result != "Rejected") {
          toast.success("Success, hash: " + result);
        } else {
          toast.error("Rejected");
        }
      } catch (e: any) {
        console.log(e);
        toast.error(e.message);
      }
      setApproving(false);
    }
  };

  const shorter = (str: string | null) =>
    str === null
      ? "Unknown"
      : str?.length > 8
      ? str.slice(0, 6) + "..." + str.slice(-4)
      : str;

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
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-center items-center gap-x-4 sm:gap-x-8 py-16">
          <Image src="/logo.png" alt="logo" width={48} height={42} />
          <h1 className="text-3xl sm:text-5xl font-bold text-white">
            Altura Guard Demo
          </h1>
        </div>

        {!connected ? (
          <div className="flex flex-col items-center gap-y-8">
            <input
              type="text"
              placeholder="Altura Guard Code"
              className="px-5 py-3 rounded-3xl w-72"
              ref={guardCode}
            />
            <Button $loading={loading} onClick={connectRequest}>
              {!loading ? "Connect" : "Connecting..."}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-center items-center gap-x-8">
              <span className="flex items-center gap-x-1 text-xl font-semibold text-green-500">
                <FcCheckmark size={24} /> Connected
              </span>
              <span className="flex items-center gap-x-2 text-lg text-white font-bold">
                {shorter(address)}
                {address && (
                  <FiCopy
                    size={20}
                    className="cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(address);
                      toast.success("Copied address to clipboard.");
                    }}
                  />
                )}
              </span>
            </div>

            <div className="flex flex-col gap-y-4 max-w-xs mx-auto mt-6">
              <Button block $loading={signing} onClick={signMessageRequest}>
                Sign Message
              </Button>
              <Button
                block
                $loading={sending}
                onClick={sendETHTransactionRequest}
              >
                Send 0.01 TBNB
              </Button>
              <Button
                block
                $loading={approving}
                onClick={sendContractTransactionRequest}
              >
                Approve 0.1 BUSD
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
