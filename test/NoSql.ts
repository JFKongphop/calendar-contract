import { Signer, Contract } from 'ethers';
import { expect } from "chai";
import { ethers } from "hardhat";

describe('NOSQL', async () => {
  let ct: Contract;

  beforeEach(async () => {
    const CalendarContract = await ethers.getContractFactory('NoSql');
    
    ct = await CalendarContract.deploy();
    await ct.deployed();
  });


  it('add and get doc', async () => {
    await ct.addDoc('test', 0, 'a', 1);
    await ct.addDoc('test', 0, 'a', 2);
    await ct.addDoc('test', 0, 'a', 3);
    await ct.addDoc('test', 0, 'b', 4);
    await ct.addDoc('test', 0, 'c', 5);
    await ct.addDoc('test2', 0, 'a', 11);
    await ct.addDoc('test2', 0, 'b', 11);
    await ct.addDoc('test3', 0, 'c', 11);
    const test1 = await ct.getDocValue('test', 'a');
    console.log(test1.map((n: any) => Number(n)));

    const a = await ct.getDocValueIndex('test', 'a', 2)
    console.log(a)

    await ct.updateDoc('test', 'a', 111)
    // const test2 = await ct.getDocValue('test', 'a');
    // console.log(test2);

    // const name3 = await ct.getCol('test')
    // console.log(name3)

    // await ct.delDoc('test', 'a')
    const name4 = await ct.getCol('test')

    console.log(name4.map((a: any) => {
      return {
        key: a.key,
        value: Number(a.value)
      }
    }))

    await ct.delDoc('test', 'a')

    const name5 = await ct.getCol('test')

    console.log(name5.map((a: any) => {
      return {
        key: a.key,
        value: Number(a.value)
      }
    }))

  })
})