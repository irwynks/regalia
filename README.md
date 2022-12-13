![Regalia Logo](https://i.imgur.com/9Bp9Irol.png){: .center-image }
# Regalia
## Motivation
Optional NFT royalties have become a reality over the past few months, and this has led to the appearance of numerous royalty enforcement/management solutions as creators find ways to revive their royalty revenue streams.

We've seen builders approach this problem differently, from metadata lockdowns to discord community access gating for NFTs with unpaid royalties.

The diversity in these approaches is a positive aspect in the sense that it provides projects with options that best suit their use case and philosophy.

However, this diversity also means that a common source of consensus between royalty management platforms is difficult to achieve without significant legwork. 

As the royalty management ecosystem grows, a common source of truth for royalty fulfillment becomes vital - .

> One degen's royalty fulfillment truth is another degen's folly.

## Regalia Royalty Management Suite
Regalia was developed over the course of the ME: Creator Monetization Hackathon as a potential solution to the 

### Regalia Oracle


### Regalia Portal
The Portal is a boilerplate implementation of Regalia Oracle, and is a full fledged royalty tracking and fulfillment app for project creators and community members alike.

### Regalia Sentinel


## CoralCube Royalties API

One of the main challenges in building a tracking solution for NFT sales (and royalties) is keeping the data fresh and up to date. The initial idea was to set up websocket subscriptions to program ids of different marketplaces in the NFT space. This is a pretty big undertaking when building from scratch due to the different transaction formats across marketplaces and associated RPC costs.

  

This is where the CoralCube API comes to the rescue. Helius currently doesn't fully support NFT sales tracking by first creator address using webhooks,

  

The tradeoff here is that instead of getting immediate updates on sales, transactions are polled on an interval.

  

##