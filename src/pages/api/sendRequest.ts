// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";


type Data = {
  success: Boolean;
  message?: String;
  data?: { token: string; address: string };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    const result: { data: { token: string; address: string } } =
      await axios.post(
        `${process.env.NEXT_PUBLIC_ALTURA_API}/api/alturaguard/addRequest?apiKey=` +
          process.env.ALTURA_API_KEY,
        {
          code: req.query.guardCode,
        }
      );
    res.status(200).json({ success: true, data: result.data });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.response.data });
  }
}
