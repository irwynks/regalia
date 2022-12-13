![Regalia Logo](https://i.imgur.com/9Bp9Irol.png =200x200)
# Regalia
Regalia is a royalty tracking and fulfillment tool linked to the Regalia Oracle, a source of consensus framework for royalty fulfillment.

Demo Video: 
Regalia Portal: https://regalia.live
Regalia Oracle Documentation: https://documenter.getpostman.com/view/19486091/2s8YzUwMBb
## Motivation
Optional NFT royalties have become a reality over the past few months, and this has led to the appearance of numerous royalty enforcement/incentivization solutions as creators find ways to revive their royalty revenue streams.

We've seen builders approach this problem differently, ranging from metadata lockdowns (Simpl3r Protect), to protocols restricting on-chain program interactions (Cardinal Creator Standard), to more off-chain alternatives with discord community access gating and royalty fulfillment reward schemes.

The diversity in these approaches is a positive aspect in the sense that it allows projects to pick and choose which solutions best suit their use case and philosophy.

However, this diversity also means that a common source of consensus between royalty management solutions is difficult to achieve without significant legwork; especially in the case of platforms that don't forcibly interact with NFT metadata or introduce new programs into the mix.

As this ecosystem of tools grows, a common source of truth for post-sale royalty fulfillment becomes vital - even more so for platforms that make use of royalty 'vault wallets' as a recipient for royalty payments.

## The Regalia Royalty Management Suite
Regalia was developed over the course of the ME: Creator Monetization Hackathon as a potential answer to this problem, while also being a fully functional royalty tracking and fulfillment platform made available to project creators and community members alike. 

The aim in developing this suite is to provide creators and developers with a boilerplate and API framework to use as a springboard upon which they can easily develop their own set of royalty management tools, all the while being sure that their tools will be able to communicate with others platforms that are built on top of or connect to Regalia.

### Regalia Oracle
Regalia Oracle provides developers with a framework through which they can easily build their own royalty tracking tools and serves as a source of truth for royalty fulfillment. In short, the Oracle API allows project creators to:

 1. Verify collection ownership using an onboarding mechanism that consists of sending a transaction from any of the creator wallets for the NFTs in the collection.
![Onboarding](https://i.imgur.com/nvp7OtR.gif)

 3. Connect a vault for royalty payments (this can be any wallet).
 
 5. Generate royalty payment transactions for any NFT in the collection.
![Generate Transaction](https://i.imgur.com/dJV4EB1.gif)
 6. Process royalty payments both historically and at time of payment.
 7. Verify royalty payment transaction status.
 ![Verify Payment TX](https://i.imgur.com/3GfygA6.gif)
 8. Verify NFT royalty fulfillment status.
![Verify NFT Fulfillment](https://i.imgur.com/3F0Wfl9.gif)
 10. Connect a webhook URL to receive updates on royalty payments and NFT sales.

Each user is granted an API key through which they can access Regalia Oracle. Documentation for the API can be found on the published [Postman documentation](https://documenter.getpostman.com/view/19486091/2s8YzUwMBb).

### Regalia Portal
The Portal is a boilerplate implementation of Regalia Oracle, and is a full fledged royalty tracking and fulfillment app for project creators and community members alike.

Check out the [demo video]() or jump onto the [portal](https://regalia.live) itself for an overview of it's functionality.

### Regalia Sentinel
Regalia Sentinel is a discord bot that was intended to bridge the divide between discord and the portal, as well as providing in channel notifications and statistics on post-sale royalty fulfillment and collection performance over time. Sentinel was originally planned as a main feature for the Regalia suite, but over the course of the project, development on the Oracle API took precedence.
[Coming Soon]

## Tech Stack
Regalia is built on top of node.js, react.js, Redis, and MongoDB. These are currently running on a hosted ubuntu server box. As the project evolves, I will probably be looking towards opting for hosted database solutions to allow for scaling.
### Helius API Integration
One of the main challenges in building a tracking solution for NFT sales (and royalties) is getting the data in the first place. The initial idea was to set up websocket subscriptions to program ids of different marketplaces in the NFT space to ingest live sales data. Due to time constraints, this proved to be too much of an undertaking. 

Fortunately, Helius provides a pretty comprehensive set of **enhanced transaction endpoints,** which made it easy to pull transaction data on NFTs in tracked collections on Regalia. Below is a snippet of the transactions API in use in the `parser.js` util.
```js
let  url  =  `https://api.helius.xyz/v0/transactions?api-key=${process.env.HELIUS_API_KEY}&commitment=confirmed`

let  {  data  }  =  await  axios({
	url,
	method:  'post',
	data:  {
		transactions: [signature]
	}
})
```
Regalia Oracle also makes use of the **webhooks** provided by Helius to track payments made to the Oracle wallet for user onboarding.
![Webhook](https://i.imgur.com/hth0SsY.png)
One of the main challenges in using the Helius API was mitigating **Too Many Requests** responses, which was finally done using a basic rate limiting system and timeouts.

## The Way Forward
The next steps for Regalia are to consolidate the Oracle API and expand upon the features it provides, as well as completing development of the Sentinel Discord bot. Challenges and considerations for future development:

1. Scaling API and RPC calls to the number of users and collections being watched.
2. Moving towards an on-chain storage solution for royalty fulfillment consensus.
3. 

The major driver for the success of this project will be adoption - the more users onboarded, the greater the repository of data on post-sale royalty fulfillment, and the more robust the ecosystem.

## Thanks!
I'd like to thank MagicEden once again for the opportunity of being a part of something bigger, as well as the judges for their consideration! Feel free to get in touch at any point in time should there be any questions or issues regarding the Regalia Suite on twitter [@irwynks_sol](https://twitter.com/irwynks_sol) or discord irwynks#8936