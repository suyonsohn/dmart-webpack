// Import the page's CSS. Webpack will know what to do with it.
import "../styles/app.css"

// Import libraries we need.
import { default as Web3 } from 'web3'
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import estoreArtifacts from '../../build/contracts/EStore.json'

const serialize = require('form-serialize')

const ipfsAPI = require('ipfs-api')
const ipfs = ipfsAPI({ host: 'localhost', port: '5001', protocol: 'http' })

// EStore is our usable abstraction, which we'll use through the code below.
const EStore = contract(estoreArtifacts)

let reader;

window.App = {
    start: () => {
        const self = this

        // Bootstrap the EStore abstraction for Use.
        EStore.setProvider(web3.currentProvider)

        // If on product details page, render product details. Otherwise, render store.
        if ($('#product-details').length > 0) {
            let productId = new URLSearchParams(window.location.search).get('id')
            renderProductDetails(productId)
        } else {
            renderStore()
        }

        $('#product-image').change((e) => {
            const file = e.target.files[0]
            reader = new window.FileReader()
            reader.readAsArrayBuffer(file)
        })

        $('#add-item-to-store').submit((e) => {
            const form = document.querySelector('#add-item-to-store')
            const obj = serialize(form, { hash: true })
            saveProduct(obj)
            e.preventDefault()
        })

        $('#buy-now').submit((e) => {
            let sendEth = $('#buy-now-price').val()
            let productId = $('#product-id').val()

            EStore.deployed().then((f) => { f.buy(productId, { value: web3.toWei(sendEth, 'ether'), from: web3.eth.accounts[0], gas: 440000 }) }).then((p) => {
                $('#msg').show()
                $('#msg').html('Your purchase is a success!')
            })
            e.preventDefault()
        })
    }
}

const renderProductDetails = (productId) => {
    EStore.deployed().then((p) => {
        p.getProduct.call(productId).then((f) => {
            $('#product-image').html(`<img src='http://localhost:8080/ipfs/${f[3]}' />`)
            $('#product-name').html(f[1])
            $('#product-price').html(displayPrice(f[6]).toNumber())
            $('#product-id').val(f[0])
            $('#buy-now-price').val(displayPrice(f[6]))
            ipfs.cat(f[4]).then((file) => {
                let descText = file.toString()
                $('#product-desc').append(`<div>${descText}</div>`)
            })
        })
    })
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
        productContainer.append(`<img src='http://localhost:8080/ipfs/${f[3]}' />`)
        productContainer.append(`<div class='title'>${f[1]}</div>`)
        productContainer.append(`<div> Price: ${displayPrice(f[6])}</div>`)
        productContainer.append(`<a href='product.html?id=${f[0]}'>Details</div>`)
        f[8] === '0x0000000000000000000000000000000000000000' ? $('#product-list').append(productContainer) : $('#product-purchased').append(productContainer)
    })
}

const displayPrice = (wei) => { return web3.fromWei(wei, 'ether') }

const saveProduct = (product) => {
    addImageToIpfs(reader).then((imageHash) => {
        addDescToIpfs(product["product-description"]).then((descHash) => {
            EStore.deployed().then((f) => {
                return f.addProductToStore(product["product-name"], product["product-category"], imageHash, descHash, Date.parse(product
                ["product-start-time"]) / 1000, web3.toWei(product["product-price"], "ether"), product["product-condition"], {
                        from: web3.eth.accounts[0], gas: 4700000
                    })
            }).then((f) => {
                console.log("Product has been added to the store!")
                console.log(f)
            })
        })
    })
}

// https://ethereum.stackexchange.com/questions/32046/how-do-i-implement-buffer-readable-stream-in-order-to-add-a-file-to-ipfs
const addImageToIpfs = (reader) => {
    return new Promise((resolve, reject) => {
        const buffer = Buffer.from(reader.result)
        ipfs.add(buffer)
            .then((response) => {
                console.log(response)
                resolve(response[0].hash)
            })
            .catch((err) => {
                console.log(err)
                reject.err
            })
    })
}

const addDescToIpfs = (productDesc) => {
    return new Promise((resolve, reject) => {
        const textBuffer = Buffer.from(productDesc, 'utf-8')
        ipfs.add(textBuffer)
            .then((response) => {
                console.log(response)
                resolve(response[0].hash)
            })
            .catch((err) => {
                console.log(err)
                reject.err
            })
    })
}

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