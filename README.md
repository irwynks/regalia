# Regalia



## Helius API
Helius dropped a comprehensive API and webhook service recently, and it's been a fun time playing around with their solution and building off of the structured data they provide.


## CoralCube Royalties API
One of the main challenges in building a tracking solution for NFT sales (and royalties) is keeping the data fresh and up to date. The initial idea was to set up websocket subscriptions to program ids of different marketplaces in the NFT space. This is a pretty big undertaking when building from scratch due to the different transaction formats across marketplaces and associated RPC costs.

This is where the CoralCube API comes to the rescue. Helius currently doesn't fully support NFT sales tracking by first creator address using webhooks,  

The tradeoff here is that instead of getting immediate updates on sales, transactions are polled on an interval.

## 