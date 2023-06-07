import { NextApiRequest, NextApiResponse } from "next";
import { Altura } from "@altura/altura-js";
import { AlturaGuard } from "@altura/altura-js/lib/alturaGuard";
import { ethers } from "ethers";
require("dotenv").config();
const altura = new Altura(process.env.ALTURA_API_KEY);
import create, { SetState } from "zustand";

type AlturaGuardStore = {
  alturaGuard: AlturaGuard | null,
  setAlturaGuard: (alturaGuard: AlturaGuard | null) => void,
};

const useAlturaGuardStore =
  create <
  AlturaGuardStore >
  ((set: SetState<AlturaGuardStore>) => ({
    alturaGuard: null,
    setAlturaGuard: (alturaGuard: AlturaGuard | null) => set({ alturaGuard }),
  }));

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { action, guardCode } = req.body;

    if (action === "connect") {
      if (!guardCode) {
        return res
          .status(400)
          .json({ error: "Please enter Altura guard code." });
      }

      try {
        const altura2: AlturaGuard = await altura.alturaGuard(guardCode);
        useAlturaGuardStore.getState().setAlturaGuard(altura2);
        // Set any other variables or perform necessary operations
        return res.status(200).json({ success: true, altura2 });
      } catch (error) {
        console.error(error);
        return res
          .status(500)
          .json({ error: "Failed to connect to Altura Guard" });
      }
    } else if (action === "signMessage") {
      const alturaGuard = useAlturaGuardStore.getState().alturaGuard;
      if (!alturaGuard) {
        return res
          .status(400)
          .json({ error: "Please connect to Altura Guard first." });
      }

      try {
        const signMessageCall = await alturaGuard.signMessage(
          "Altura Guard II Sign Message Demo"
        );
        if (signMessageCall.error) {
          return res.status(400).json({ error: signMessageCall.error });
        }
        const signature = `Success, signature: ${signMessageCall}`;
        return res.status(200).json({ success: true, signature });
      } catch (error) {
        console.error(error);
        return res
          .status(500)
          .json({
            error: `Failed to sign message. Error: ${JSON.stringify(error)}`,
          });
      }
    } else if (action === "sendETH") {
      const alturaGuard = useAlturaGuardStore.getState().alturaGuard;
      if (!alturaGuard) {
        return res
          .status(400)
          .json({ error: "Please connect to Altura Guard first." });
      }

      try {
        const sendNativeTokenCall = await alturaGuard.sendNativeToken(
          "10000000000000000",
          97,
          "0x8B0eeCABAc71696eb65a63a3a15E3Fc5f83BD3D9"
        );
        if (sendNativeTokenCall.error) {
          return res.status(400).json({ error: sendNativeTokenCall.error });
        }
        const signature = `Success, signature: ${sendNativeTokenCall}`;
        return res.status(200).json({ success: true, signature });
      } catch (error) {
        console.error(error);
        return res
          .status(500)
          .json({
            error: `Failed to send Native Token. Error: ${JSON.stringify(
              error
            )}`,
          });
      }
    } else if (action === "sendContractCall") {
      const alturaGuard = useAlturaGuardStore.getState().alturaGuard;
      if (!alturaGuard) {
        return res
          .status(400)
          .json({ error: "Please connect to Altura Guard first." });
      }
      const spenderAddress = "0x78867BbEeF44f2326bF8DDd1941a4439382EF2A8";
      const contractAddress = "0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7";
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
      try {
        const data = contract.interface.encodeFunctionData("approve", [
          spenderAddress,
          "100000000000000000",
        ]);
        const sendContractTransactionCall =
          await alturaGuard.sendContractTransaction(contractAddress, 97, data);
        if (sendContractTransactionCall.error) {
          return res
            .status(400)
            .json({ error: sendContractTransactionCall.error });
        }
        const signature = `Success, hash: ${sendContractTransactionCall}`;
        return res.status(200).json({ success: true, signature });
      } catch (error) {
        console.error(error);
        return res
          .status(500)
          .json({
            error: `Failed to send contract call. Error: ${JSON.stringify(
              error
            )}`,
          });
      }
    } else if (action === "revoke") {
      const alturaGuard = useAlturaGuardStore.getState().alturaGuard;
      if (!alturaGuard) {
        return res
          .status(400)
          .json({ error: "Please connect to Altura Guard first." });
      }

      try {
        await alturaGuard.revokeSession();
        useAlturaGuardStore.getState().setAlturaGuard(null);
        const signature = `Session Revoked!`;
        return res.status(200).json({ success: true, signature });
      } catch (error) {
        console.error(error);
        return res
          .status(500)
          .json({ error: `Something went worng: ${JSON.stringify(error)}` });
      }
    } else if (action === "checkSession") {
      const alturaGuard = useAlturaGuardStore.getState().alturaGuard;
      if (!alturaGuard) {
        return res
          .status(400)
          .json({ error: "Please connect to Altura Guard first." });
      }

      try {
        const session = await alturaGuard.checkSession();
        const signature = `Session: ${session}`;
        return res.status(200).json({ success: true, signature });
      } catch (error) {
        useAlturaGuardStore.getState().setAlturaGuard(null);
        console.error(error);
        return res
          .status(500)
          .json({ error: `Something went worng: ${JSON.stringify(error)}` });
      }
    } else {
      return res.status(400).json({ error: "Invalid action specified." });
    }
  } else {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
}
