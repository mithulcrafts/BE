import { ethers } from 'hardhat'
import * as path from 'path'
import * as fs from 'fs'

async function main() {
  console.log('Seeding SupplyChain demonstration data...')

  const deploymentsPath = path.join(__dirname, '../../client/src/deployments.json')
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'))
  const contractAddress = deployments.networks['1337']?.SupplyChain?.address

  if (!contractAddress) {
    throw new Error('Contract address not found in deployments.json')
  }

  console.log('Using contract at:', contractAddress)
  const SupplyChain = await ethers.getContractFactory('SupplyChain')
  const supplyChain = SupplyChain.attach(contractAddress) as any

  const [owner, supplier, producer, distributor, seller] = await ethers.getSigners()

  console.log('--- 1. Registering Supply Chain Organizations ---')
  // Register Supplier
  const tx1 = await supplyChain.connect(owner).addSupplier(supplier.address, 'Alpha Bio-Chem Supplies Ltd.', 'Mumbai Special Economic Zone')
  await tx1.wait()
  console.log('Registered Supplier:', supplier.address)

  // Register Producer
  const tx2 = await supplyChain.connect(owner).addProducer(producer.address, 'Apex Pharmaceuticals Corp.', 'Hyderabad Biotech Park')
  await tx2.wait()
  console.log('Registered Producer:', producer.address)

  // Register Distributor
  const tx3 = await supplyChain.connect(owner).addDistributor(distributor.address, 'BlueDart Cold-Chain Express Logistics', 'New Delhi Cargo Hub')
  await tx3.wait()
  console.log('Registered Distributor:', distributor.address)

  // Register Seller
  const tx4 = await supplyChain.connect(owner).addSeller(seller.address, 'Apollo Retail Health & Medicos', 'Bengaluru South Gateway')
  await tx4.wait()
  console.log('Registered Seller:', seller.address)

  console.log('--- 2. Creating Demonstration Products ---')
  // Product 1: Paracetamol 500mg Batch-101
  const p1 = await supplyChain.connect(producer).addProduct(
    'Paracetamol 500mg (Batch #PC-101)',
    'Analgesic and antipyretic tablets, USP Standard, 5000 units'
  )
  await p1.wait()
  console.log('Added Product 1 (Batch #PC-101)')

  // Product 2: Amoxicillin 250mg Batch-204
  const p2 = await supplyChain.connect(producer).addProduct(
    'Amoxicillin Trihydrate 250mg (Batch #AMX-204)',
    'Broad-spectrum antibiotic capsules, BP Standard, 2000 units'
  )
  await p2.wait()
  console.log('Added Product 2 (Batch #AMX-204)')

  // Product 3: Covaxin Vaccine Batch-CVX88
  const p3 = await supplyChain.connect(producer).addProduct(
    'Covaxin Whole-Virion Vaccine (Batch #CVX-88)',
    'Inactivated whole-virion vaccine vials, 2-8 C monitored, 1000 units'
  )
  await p3.wait()
  console.log('Added Product 3 (Batch #CVX-88)')

  // Product 4: Insulin Glargine Pen Batch-INS909
  const p4 = await supplyChain.connect(producer).addProduct(
    'Insulin Glargine Solostar Pen (Batch #INS-909)',
    'Long-acting human insulin analog 100 units/ml, 500 pre-filled pens'
  )
  await p4.wait()
  console.log('Added Product 4 (Batch #INS-909)')

  console.log('--- 3. Progressing Products Through Lifecycle Stages ---')

  // Product 1: Complete lifecycle (Sold to customer)
  console.log('Progressing Product 1 to SOLD...')
  await (await supplyChain.connect(supplier).supplyProduct(1)).wait()
  await (await supplyChain.connect(producer).processProduct(1)).wait()
  await (await supplyChain.connect(distributor).distributeProduct(1)).wait()
  await (await supplyChain.connect(seller).listForSale(1)).wait()
  await (await supplyChain.connect(seller).markProductSold(1)).wait()
  console.log('Product 1 is now SOLD!')

  // Product 2: In Pharmacy Shelf (For Sale)
  console.log('Progressing Product 2 to FOR SALE...')
  await (await supplyChain.connect(supplier).supplyProduct(2)).wait()
  await (await supplyChain.connect(producer).processProduct(2)).wait()
  await (await supplyChain.connect(distributor).distributeProduct(2)).wait()
  await (await supplyChain.connect(seller).listForSale(2)).wait()
  console.log('Product 2 is now FOR SALE!')

  // Product 3: In Transit with Logistics Distributor
  console.log('Progressing Product 3 to IN TRANSIT...')
  await (await supplyChain.connect(supplier).supplyProduct(3)).wait()
  await (await supplyChain.connect(producer).processProduct(3)).wait()
  console.log('Product 3 is now IN TRANSIT!')

  // Product 4: In Processing with Supplier
  console.log('Progressing Product 4 to PROCESSING...')
  await (await supplyChain.connect(supplier).supplyProduct(4)).wait()
  console.log('Product 4 is now PROCESSING!')

  console.log('✅ Demonstration seed completed successfully!')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed error:', err)
    process.exit(1)
  })
