import Head from "next/head";
import { utf8ToHex } from "@walletconnect/encoding";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import Image from "next/image";
import { FcCheckmark } from "react-icons/fc";
import { FiCopy } from "react-icons/fi";
import { AlturaGuard } from "@altura/altura-js/lib/alturaGuard";
import styled, { css } from "styled-components";
require('dotenv').config();

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
  const [alturaGuard, setAlturaGuard] = useState<AlturaGuard | null>(null); 
  // connection request
  const connectRequest = async () => {
    if (!guardCode?.current?.value) {
      toast.warning("Please enter Altura guard code.");
      return;
    }
  
    if (guardCode?.current?.value && !connected) {
      setLoading(true);
  
      try {
        const response = await fetch('/api/connectRequest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ guardCode: guardCode.current.value, action: 'connect' }),
        });
  
        if (response.ok) {
          const data = await response.json();
          setAlturaGuard(data.altura2);
          setConnected(true);
        } else {
          throw new Error('Failed to connect to Altura Guard');
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to connect to Altura Guard");
      }
  
      setLoading(false);
    }
  };


  // sign message request
  const signMessageRequest = async () => {
    if (connected) {
      setSigning(true);
  
      try {
        if (!alturaGuard) {
          toast.warning('Please connect to Altura Guard first.');
          return;
        }
  
        const response = await fetch('/api/connectRequest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'signMessage' }),
        });
  
        if (response.ok) {
          const data = await response.json();
          toast.success('Success, signature: ' + data.signature);
        } else {
          throw new Error('Failed to sign message.');
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to sign message. Error: ' + JSON.stringify(error));
      }
  
      setSigning(false);
    }
  };

  const sendETHTransactionRequest = async () => {
    if (connected) {
      setSending(true);
  
      try {
        if (!alturaGuard) {
          toast.warning('Please connect to Altura Guard first.');
          return;
        }
  
        const response = await fetch('/api/connectRequest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'sendETH' }),
        });
  
        if (response.ok) {
          const data = await response.json();
          toast.success('Success, signature: ' + data.signature);
        } else {
          throw new Error('Failed to send native token.');
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to send native token. Error: ' + JSON.stringify(error));
      }
  
      setSending(false);
    }
  };
  const sendContractTransactionRequest = async () => {
    if (connected) {
      setApproving(true);
  
      try {
        if (!alturaGuard) {
          toast.warning('Please connect to Altura Guard first.');
          return;
        }
  
        const response = await fetch('/api/connectRequest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'sendContractCall' }),
        });
  
        if (response.ok) {
          const data = await response.json();
          toast.success('Success, signature: ' + data.signature);
        } else {
          throw new Error('Failed to approve token.');
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to approve token. Error: ' + JSON.stringify(error));
      }
  
      setApproving(false);
    }
  };
  const revokeSession = async () => {
    if (connected) {
      try {
        if (!alturaGuard) {
          toast.warning('Please connect to Altura Guard first.');
          return;
        }
  
        const response = await fetch('/api/connectRequest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'revoke' }),
        });
  
        if (response.ok) {
          const data = await response.json();
          setToken(null)
          setConnected(false)
          setAlturaGuard(null)
          setAddress(null)
          
          toast.success(data.signature);
        } else {
          throw new Error('Failed to approve token.');
        }
      } catch (error) {
        console.error(error);
        toast.error('Something went worng');
      }
    }
  };


  const checkSession = async () => {
    if (connected) {
      try {
        if (!alturaGuard) {
          toast.warning('Please connect to Altura Guard first.');
          return;
        }
  
        const response = await fetch('/api/connectRequest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'checkSession' }),
        });
  
        if (response.ok) {
          const data = await response.json();
          toast.success(data.signature);
        } else {
          setToken(null)
          setConnected(false)
          setAlturaGuard(null)
          setAddress(null)
        }
      } catch (error) {
        console.error(error);
        toast.error('Something went worng');
      }
    }
  };

  useEffect(() => {
    if (token) {
      const interval = setInterval(() => {
        checkSession();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [token]);


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
              <Button
                block
                $loading={approving}
                onClick={revokeSession}
                className="!bg-red-500"
              >
                Revoke Connection
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
