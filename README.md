
![Logo](https://altura-orpin.vercel.app/ogimg.png)


Website: https://alturanft.com

Live Demo: https://apiguarddemo.alturanft.com
# Altura Guard II Demo - API Integration

This demo showcases Altura Guard II integration via the API with zero dependencies.




## Run Locally

Clone the project

```bash
  git clone https://github.com/alturanft/Altura-Guard-II-Demo
```

Go to the project directory

```bash
  cd Altura-Guard-II-Demo
```

Edit .env.empty with your API Key

```bash
ALTURA_API_KEY = # Your Altura API key that you can get for free at https://app.alturanft.com
NEXT_PUBLIC_ALTURA_API = "https://api.alturanft.com" / "https://cloud.alturanft.com" (Live / Testing)
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run dev
```


## Implementation

### Connect to user wallet

Submit the simple five word code the user provided and connect to the users wallet instantly

```http
  POST /api/alturaguard/addRequest
```

| Body | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `code` | `string` | **Required**. User entered Altura Guard code |

Returns

| Parameter | Type | Description |
| :--------- | :-------- | :------------------- |
| `address` | `string` | Users wallet address. |
| `token` | `string` | This token is used to make transaction requests |

You should store both the address and token in a database. The user can revoke this token at any point and so can the game. If you lose this token, you will not be able to create a new connection with the user unless they revoke the existing one.

### Transaction Requests

#### Polling Transaction Response

When a transaction has been requested by the game, you will recieve a requestID. Using both your requestID and user token, you can poll the response of this request.

```http
  POST /api/alturaguard/getResponse
  ```

| Body | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `token` | `string` | **Required**. User token recieved when authenticating |
| `requestId` | `string` | **Required**. Transaction request ID received |

Returns ``204`` if there is no response yet.

Returns ``404`` if there has been no response after ten minutes.

Returns ``200`` with body ``Rejected`` if user rejected request. 

Returns ``200`` with body ``txHash / signature`` if user approved request. 

--- 
#### Submitting a signature request


```http
  POST /api/alturaguard/request
  ```
You need to encode the message in hex before requesting a signature.

```js
const message = utf8ToHex("Altura Guard II Sign Message Demo", true);
```

| Body | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `token` | `string` | **Required**. User token recieved when authenticating |
| `reqParameters` | `array` | **Required**. ``["signature", message]`` |

Returns

| Parameter | Type | Description |
| :--------- | :-------- | :------------------- |
| `requestId` | `string` | ID of the transaction request to poll for |

--- 
#### Submitting a native transaction request


```http
  POST /api/alturaguard/request
  ```
You need to encode the value in hex before requesting a transaction.

```js
const amountToSend = BigInt("10000000000000000");  //0.1 NATIVE TOKEN (ETH/BNB/AVAX etc)
const value = "0x" + amountToSend.toString(16)
```

You also need to add the neccessary paramaters before requesting a transaction.

```js
const from = userAddress //the address you're sending from (connected users address)
const to = "0x0000000000000000000000000000000000000000" // the address you're sending the transaction to 
const data = "0x" // the data which is always 0x when sending a native transaction
```

Then we need to make the transaction object

```js
const tx = {
  from,
  to,
  data,
  value,
},
```

We also need the chain id (https://chainlist.org)

```js
const chainId = 1; // ETH chain id
```

| Body | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `token` | `string` | **Required**. User token recieved when authenticating |
| `reqParameters` | `array` | **Required**. ``["transaction", tx, chainId]`` |

Returns

| Parameter | Type | Description |
| :--------- | :-------- | :------------------- |
| `requestId` | `string` | ID of the transaction request to poll for |

--- 
#### Submitting a contract transaction request


```http
  POST /api/alturaguard/request
  ```
You need to encode the value in hex before requesting a transaction.

```js
const amountToSend = "0"  // sending value 0
const value = "0x" + amountToSend
```

You also need to add the neccessary paramaters before requesting a transaction.

```js
const from = userAddress //the address you're sending from (connected users address)
const to = "0x0000000000000000000000000000000000000000", // the address you're sending the transaction to 
```

Now we need to get the data to send to represent the contract data. In this example we are approving 0.1 BUSD

```js
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
const spender = userAddress; // the address of the spender (user connected)
const amount = ethers.parseEther("0.1"); // the amount to approve
const data = contract.interface.encodeFunctionData("approve", [
                spender,
                amount,
              ]);
```

Then we need to make the transaction object

```js
const tx = {
  from,
  to,
  data,
  value,
},
```

We also need the chain id (https://chainlist.org)

```js
const chainId = 1; // ETH chain id
```

| Body | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `token` | `string` | **Required**. User token recieved when authenticating |
| `reqParameters` | `array` | **Required**. ``["transaction", tx, chainId]`` |

Returns

| Parameter | Type | Description |
| :--------- | :-------- | :------------------- |
| `requestId` | `string` | ID of the transaction request to poll for |
