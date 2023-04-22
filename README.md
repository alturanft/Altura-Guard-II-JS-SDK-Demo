
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
NEXT_PUBLIC_ALTURA_API = "https://api.alturanft.com"
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
