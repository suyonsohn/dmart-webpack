// Import the page's CSS. Webpack will know what to do with it.
import "../styles/app.css"

// Import libraries we need.
import { default as Web3 } from 'web3'
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import estoreArtifacts from '../../build/contracts/EStore.json'

// EStore is our usable abstraction, which we'll use through the code below.
const EStore = contract(estoreArtifacts)

window.App = {
    start: () => {
        const self = this

        // Bootstrap the EStore abstraction for Use.
        EStore.setProvider(web3.currentProvider)

        renderStore()
    }
}

const renderStore = () => {
    // Get product count
    let instance

    return EStore.deployed().then((f) => {
        instance = f
        return instance.productIndex.call()
    }).then((count) => {
        for (let i = 0; i < count; i++) {
            renderProduct(instance, i)
        }
    })
}

const renderProduct = (instance, index) => {
    instance.getProduct.call(index).then((f) => {
        let productContainer = $('<div>')
        productContainer.addClass('col-sm-3 text-center col-margin-bottom-1 product')
        productContainer.append(`<div class='title'>${f[1]}</div>`)
        productContainer.append(`<div> Price: ${displayPrice(f[6])}</div>`)
        f[8] === '0x0000000000000000000000000000000000000000' ? $('#product-list').append(productContainer) : $('#product-purchased').append(productContainer)
    })
}

const displayPrice = (wei) => { return web3.fromWei(wei, 'ether') }

window.addEventListener('load', () => {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
        console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 EStore, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
        // Use Mist/MetaMask's provider
        window.web3 = new Web3(web3.currentProvider)
    } else {
        console.warn("No web3 detected. Falling back to http://127.0.0.1:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask")
        // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"))
    }

    App.start()
})