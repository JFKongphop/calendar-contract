import hre, { ethers } from 'hardhat';

// npx hardhat run --network goerli deploy.ts
// if plugin is not support npx hardhat verify --network holesky address

const deploy = async () => {
  const CompareLibrary = await ethers.getContractFactory('Library');
  const compareLibrary = await CompareLibrary.deploy();
  await compareLibrary.deployed();

  const CalendarContract = await ethers.getContractFactory('Calendar', {
    libraries: {
      Library: compareLibrary.address
    },
  });

  const calendar = await CalendarContract.deploy()

  await calendar.deployTransaction.wait(5);

  console.log('CALENDAR ADDRESS', calendar.address);
  console.log('LIBRARY ADDRESS', calendar.address);

  try {
    await hre.run('verify:verify', {
      address: calendar.address,
      contract: 'contracts/Calendar.sol:Calendar'
    });
  }
  catch (e) {
    console.log('Calendar error');
    console.log(e);
  }

  try {
    await hre.run('verify:verify', {
      address: calendar.address,
      contract: 'contracts/lib/Library.sol:Library'
    });
  }
  catch (e) {
    console.log('Library error');
    console.log(e)
  }
}

deploy().catch((err) => {
  console.log(err),
  process.exitCode = 1;
})
