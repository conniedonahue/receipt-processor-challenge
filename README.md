# Receipt Processor

## Docker instructions

To run this application in Docker, do the following:

1. _Clone this repo:_ Grab the HTTPS URL from the main page of this repository and clicking the `<> Code` button. Open a Terminal and change the current working directory to where you'd like the cloned repository to be stored. Use following git command: `git clone <repository_HTTPS_URL>`.
2. _Enter the directory in your terminal:_ `cd <your_repository_folder>`
3. _Build the Docker image:_ `docker build -t node-receipt-processor .` Note: the -t flag sets the tag for the image, feel free to replace `node-receipt-processor` with a different tag.
4. _Run the Container:_ After building the image, you can run your application with the following command: `docker run -p 3000:3000 my-node-app`. This maps port `3000` on your local machine to port `3000` inside the Docker container, which is the port your app will listen on. If you use a different port in your app, adjust the port mappings accordingly.
5. _Test out the App:_ check out the POST and GET requests using Postman or by sending curl requests. Here is an example:

```
curl -X POST http://localhost:3000/receipts/process \
-H "Content-Type: application/json" \
-d '{
    "retailer": "Target",
    "purchaseDate": "2022-01-02",
    "purchaseTime": "13:13",
    "total": "1.25",
    "items": [
        {"shortDescription": "Pepsi - 12-oz", "price": "1.25"}
    ]
}'
```

This should return a JSON object like `{"id":"c93d4e01-cbea-4763-9cf1-ac339d75e899"}`

You can then take the value of that `id` to send a GET request:

```
curl http://localhost:3000/receipts/{enter your id here}/points
```

And that should return an object like `{"points":31}`.

6. _Find the Docker container-id_: To see a list of your Docker Containers, enter: `docker ps`.
7. _Close down the docker container_: When you would like to shut down the container, enter the following command into your terminal: `docker stop <container-id>`

## Node instructions

To run this server locally using Node, do the following:

1. _Clone this repo:_ Grab the HTTPS URL from the main page of this repository and clicking the `<> Code` button. Open a Terminal and change the current working directory to where you'd like the cloned repository to be stored. Use following git command: `git clone <repository_HTTPS_URL>`.
2. _Open the project in an IDE:_ Find the cloned repo and open it in an IDE like VS Code.
3. _Run the server:_ Run `npm run start` and open up the go to `localhost:3000/`
4. _Test out the app:_ Try out some of the curl requests listed above.

## Design considerations

### Database

This receipt processor stores its ticket information in memory. I decided to store it in a Map, `receiptDatabase`, which could port nicely to a key-value database like DynamoDb. The receiptDatabase follows: KEY: `receiptId`, VALUE: `{points: <points>, receipt: <receipt>}`. The Map enables constant lookup by `receiptId`.

I decided it might be wise to hold onto the receipt and store this in the database, although in a larger ecosystem this might be redundant and we could instead optimize this service to only store `receiptId`s and `points`. 

### Backend

The backend is built in Node/Express.

- Input validation: I decided to make the use a middleware pattern to validate the Receipts. With more time, I would have either created a Receipt class or used TypeScript.
- The POST request generates a `receiptId` and then sends it back to the user while the backend continues to calculate the point totals with `calculatePoints`.
- The `calculatePoints` could benefit with a bit more fault tolerance/retry capabilities.


## PROMPT: Receipt Processor

Build a webservice that fulfils the documented API. The API is described below. A formal definition is provided
in the [api.yml](./api.yml) file, but the information in this README is sufficient for completion of this challenge. We will use the
described API to test your solution.

Provide any instructions required to run your application.

Data does not need to persist when your application stops. It is sufficient to store information in memory. There are too many different database solutions, we will not be installing a database on our system when testing your application.

## Language Selection

You can assume our engineers have Go and Docker installed to run your application. Go is our preferred language, but it is not a requirement for this exercise. If you are not using Go, include a Dockerized setup to run the code. You should also provide detailed instructions if your Docker file requires any additional configuration to run the application.

## Submitting Your Solution

Provide a link to a public repository, such as GitHub or BitBucket, that contains your code to the provided link through Greenhouse.

---

## Summary of API Specification

### Endpoint: Process Receipts

- Path: `/receipts/process`
- Method: `POST`
- Payload: Receipt JSON
- Response: JSON containing an id for the receipt.

Description:

Takes in a JSON receipt (see example in the example directory) and returns a JSON object with an ID generated by your code.

The ID returned is the ID that should be passed into `/receipts/{id}/points` to get the number of points the receipt
was awarded.

How many points should be earned are defined by the rules below.

Reminder: Data does not need to survive an application restart. This is to allow you to use in-memory solutions to track any data generated by this endpoint.

Example Response:

```json
{ "id": "7fb1377b-b223-49d9-a31a-5a02701dd310" }
```

## Endpoint: Get Points

- Path: `/receipts/{id}/points`
- Method: `GET`
- Response: A JSON object containing the number of points awarded.

A simple Getter endpoint that looks up the receipt by the ID and returns an object specifying the points awarded.

Example Response:

```json
{ "points": 32 }
```

---

# Rules

These rules collectively define how many points should be awarded to a receipt.

- One point for every alphanumeric character in the retailer name.
- 50 points if the total is a round dollar amount with no cents.
- 25 points if the total is a multiple of `0.25`.
- 5 points for every two items on the receipt.
- If the trimmed length of the item description is a multiple of 3, multiply the price by `0.2` and round up to the nearest integer. The result is the number of points earned.
- 6 points if the day in the purchase date is odd.
- 10 points if the time of purchase is after 2:00pm and before 4:00pm.

## Examples

```json
{
  "retailer": "Target",
  "purchaseDate": "2022-01-01",
  "purchaseTime": "13:01",
  "items": [
    {
      "shortDescription": "Mountain Dew 12PK",
      "price": "6.49"
    },
    {
      "shortDescription": "Emils Cheese Pizza",
      "price": "12.25"
    },
    {
      "shortDescription": "Knorr Creamy Chicken",
      "price": "1.26"
    },
    {
      "shortDescription": "Doritos Nacho Cheese",
      "price": "3.35"
    },
    {
      "shortDescription": "   Klarbrunn 12-PK 12 FL OZ  ",
      "price": "12.00"
    }
  ],
  "total": "35.35"
}
```

```text
Total Points: 28
Breakdown:
     6 points - retailer name has 6 characters
    10 points - 5 items (2 pairs @ 5 points each)
     3 Points - "Emils Cheese Pizza" is 18 characters (a multiple of 3)
                item price of 12.25 * 0.2 = 2.45, rounded up is 3 points
     3 Points - "Klarbrunn 12-PK 12 FL OZ" is 24 characters (a multiple of 3)
                item price of 12.00 * 0.2 = 2.4, rounded up is 3 points
     6 points - purchase day is odd
  + ---------
  = 28 points
```

---

```json
{
  "retailer": "M&M Corner Market",
  "purchaseDate": "2022-03-20",
  "purchaseTime": "14:33",
  "items": [
    {
      "shortDescription": "Gatorade",
      "price": "2.25"
    },
    {
      "shortDescription": "Gatorade",
      "price": "2.25"
    },
    {
      "shortDescription": "Gatorade",
      "price": "2.25"
    },
    {
      "shortDescription": "Gatorade",
      "price": "2.25"
    }
  ],
  "total": "9.00"
}
```

```text
Total Points: 109
Breakdown:
    50 points - total is a round dollar amount
    25 points - total is a multiple of 0.25
    14 points - retailer name (M&M Corner Market) has 14 alphanumeric characters
                note: '&' is not alphanumeric
    10 points - 2:33pm is between 2:00pm and 4:00pm
    10 points - 4 items (2 pairs @ 5 points each)
  + ---------
  = 109 points
```

---

# FAQ

### How will this exercise be evaluated?

An engineer will review the code you submit. At a minimum they must be able to run the service and the service must provide the expected results. You
should provide any necessary documentation within the repository. While your solution does not need to be fully production ready, you are being evaluated so
put your best foot forward.

### I have questions about the problem statement

For any requirements not specified via an example, use your best judgment to determine the expected result.

### Can I provide a private repository?

If at all possible, we prefer a public repository because we do not know which engineer will be evaluating your submission. Providing a public repository
ensures a speedy review of your submission. If you are still uncomfortable providing a public repository, you can work with your recruiter to provide access to
the reviewing engineer.

### How long do I have to complete the exercise?

There is no time limit for the exercise. Out of respect for your time, we designed this exercise with the intent that it should take you a few hours. But, please
take as much time as you need to complete the work.

```

```
