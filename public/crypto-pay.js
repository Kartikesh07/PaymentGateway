const CryptoPaymentGateway = {
    config: {
      contractAddress: "0xA31C0e25409EC88fdBcFeb9A5E92E19aEcf4b5cC",
      buttonId: 'cryptoPayButton',
      testMode: true,
      onSuccess: null,
      onError: null
    },
  
    contractABI: [
      {
        "inputs": [{"internalType": "address","name": "merchant","type": "address"}],
        "name": "payMerchant",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "address","name": "","type": "address"}],
        "name": "merchants",
        "outputs": [
          {"internalType": "address","name": "merchantAddress","type": "address"},
          {"internalType": "uint256","name": "registrationTime","type": "uint256"},
          {"internalType": "uint256","name": "totalReceived","type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ],
  
    async init(customConfig = {}) {
      this.config = { ...this.config, ...customConfig };
      const button = document.getElementById(this.config.buttonId);
      if (button) {
        button.addEventListener('click', () => this.processCryptoPayment());
        this.styleButton(button);
      }
    },
  
    styleButton(button) {
      Object.assign(button.style, {
        backgroundColor: '#6851ff',
        color: 'white',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
      });
    },
  
    async getMaticPriceInUSD() {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd');
        const data = await response.json();
        return data['matic-network'].usd;
      } catch (error) {
        console.error("Error fetching MATIC price:", error);
        return null;
      }
    },
  
    async convertUSDToMatic(usdAmount) {
      const maticPrice = await this.getMaticPriceInUSD();
      if (!maticPrice) throw new Error("Could not fetch MATIC price");
      return (parseFloat(usdAmount) / maticPrice).toString();
    },
  
    async processCryptoPayment() {
      const button = document.getElementById(this.config.buttonId);
      const merchantAddress = button.getAttribute('data-merchant-address');
      const paymentAmountUSD = button.getAttribute('data-payment-amount-usd');
  
      if (!paymentAmountUSD || isNaN(parseFloat(paymentAmountUSD)) || parseFloat(paymentAmountUSD) <= 0) {
        return this.config.onError?.(new Error('Invalid payment amount'));
      }
  
      if (!merchantAddress || merchantAddress.trim() === '') {
        return this.config.onError?.(new Error('Invalid merchant address'));
      }
  
      if (typeof window.ethereum === "undefined") {
        return this.config.onError?.(new Error('Please install MetaMask'));
      }
  
      try {
        // Switch to Polygon Amoy testnet
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x13882' }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x13882',
                chainName: 'Polygon Amoy Testnet',
                nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                rpcUrls: ['https://rpc-amoy.polygon.technology/'],
                blockExplorerUrls: ['https://www.oklink.com/amoy']
              }]
            });
          }
        }
  
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(this.config.contractAddress, this.contractABI, signer);
  
        if (!ethers.isAddress(merchantAddress)) {
          throw new Error("Invalid merchant address format");
        }
  
        const merchantData = await contract.merchants(merchantAddress);
        if (merchantData[0] === "0x0000000000000000000000000000000000000000") {
          throw new Error("Merchant not registered");
        }
  
        const maticAmount = await this.convertUSDToMatic(paymentAmountUSD);
        
        const gasEstimate = await contract.payMerchant.estimateGas(merchantAddress, {
          value: ethers.parseEther(maticAmount)
        });
  
        const gasLimit = gasEstimate * BigInt(12) / BigInt(10);
  
        const tx = await contract.payMerchant(merchantAddress, {
          value: ethers.parseEther(maticAmount),
          gasLimit: gasLimit
        });
  
        button.disabled = true;
        button.textContent = 'Processing...';
        
        await tx.wait();
        this.config.onSuccess?.(tx);
        
        button.textContent = 'Payment Successful!';
        setTimeout(() => {
          button.disabled = false;
          button.textContent = `Pay $${paymentAmountUSD} (Test Mode)`;
        }, 3000);
  
      } catch (error) {
        console.error("Payment failed:", error);
        this.config.onError?.(error);
        button.disabled = false;
      }
    }
  };