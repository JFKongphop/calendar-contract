import hre, { ethers } from 'hardhat';

// npx hardhat run --network goerli deploy.ts
// if plugin is not support npx hardhat verify --network holesky address

const deploy = async () => {
  const LibraryContract = await ethers.getContractFactory('Library');
  const libraryContract = await LibraryContract.deploy();
  const libraryAddress = await libraryContract.getAddress();
  
  const CalendarContract = await ethers.getContractFactory('Calendar', {
    libraries: {
      Library: libraryAddress,
    }
  });

  const calendarContract = await CalendarContract.deploy();

  await calendarContract.deploymentTransaction()?.wait(5);

  const calendarAddress = await calendarContract.getAddress();

  console.log('LIBRARY ADDRESS', libraryAddress);
  console.log('CALENDAR ADDRESS', calendarAddress);

  try {
    await hre.run('verify:verify', {
      address: calendarAddress,
      contract: 'contracts/Calendar.sol:Calendar'
    });
  }
  catch (e) {
    console.log('Calendar error');
    console.log(e);
  }

  try {
    await hre.run('verify:verify', {
      address: calendarAddress,
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