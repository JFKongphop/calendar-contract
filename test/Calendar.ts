import { Signer, Contract } from 'ethers';
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe('Calendar', async () => {
  let user1: Signer, user2: Signer;
  let ct: Contract;

  beforeEach(async () => {
    [user1, user2] = await ethers.getSigners();

    const CompareLibrary = await ethers.getContractFactory('Library');
    const compareLibrary = await CompareLibrary.deploy();
    await compareLibrary.deployed();

    const CalendarContract = await ethers.getContractFactory('Calendar', {
      libraries: {
        Library: compareLibrary.address
      },
    });
    
    ct = await CalendarContract.deploy();
    await ct.deployed();

  });

  describe('Create Event Store only title', () => {
    it('Should return title of event store array', async () => {
      const title = 'title group 1'
      await ct.createEventStore(title);

      const events = await ct.connect(user1).getEventTitle();
      const actualResult = events.map((event: any) => ({
        title: event[0],
        parctitipationAmount: event[1].toNumber()
      }));
      const eventExpected = [{ title, parctitipationAmount: 0 }];

      expect(eventExpected).to.deep.equal(actualResult) 
    });

    it('Should return lenght of event title array', async () => {
      await ct.createEventStore('title 1');
      const eventTitles = await ct.connect(user1).getEventTitle();
      
      const lenghtOfEventStore = eventTitles.map((event: any) => ({
        title: event[0],
        parctitipationAmount: event[1],
        del: event[2]
      })).length;

      expect(1).to.equal(lenghtOfEventStore);
    });

    it('Should return revert of limitation require 5 event store', async () => {
      for(let i = 0; i < 6; i++) {
        await ct.createEventStore(`title ${i}`);
      }

      const revertWord = 'Limitation to create event store';
      await expect(ct.createEventStore('')).to.be.revertedWith(revertWord);
    });

    it('Should return revert of invalid title', async () => {
      const revertWord = 'Invalid title';
      await expect(ct.createEventStore('')).to.be.revertedWith(revertWord);    
    });

    it('Should return revert of limitation create event', async () => {
      await ct.createEventStore('title group 1');

      const revertWord = 'Cannot create duplicate name of event store';
      await expect(ct.createEventStore('title group 1')).to.be.revertedWith(revertWord);      
    });

  });

  describe('Add Event Store all event data', () => {
    it('Should return event store array', async () => {
      await ct.createEventStore('title group 1');

      const lenghtOfEventStore = 1; // await ct.connect(user1).getLengthOfEventStore();
      for (let i = 1; i < lenghtOfEventStore + 1; i++) {
        for (let j = 1; j < 3; j++) {
          await ct.connect(user1).addEventStore(
            i,
            i,
            10,
            20,
            `title group ${i}`,
            `title ${j}`,
            'test',
            '0-30'
          );
        }
      }
      
      for (let i = 0; i < lenghtOfEventStore; i++) {
        const eventStores = await ct.connect(user1).getEventStore(i, '0-30');

        const eventSchedule = eventStores[2].map((event: any) => ({
          day: event[0].toNumber(),
          id: event[1].toNumber(),
          start_event: event[2].toNumber(),
          end_event: event[3].toNumber(),
          title: event[4],
          description: event[5]
        }));
        const actualResult = {
          title: eventStores[0],
          accounts: eventStores[1],
          eventSchedule: eventSchedule
        };

        // for only one loop
        const expectedResult = {
          title: 'title group 1',
          accounts: [],
          eventSchedule: [
            {
              day: 1,
              id: 1,
              start_event: 10,
              end_event: 20,
              title: 'title 1',
              description: 'test'
            },
            {
              day: 1,
              id: 1,
              start_event: 10,
              end_event: 20,
              title: 'title 2',
              description: 'test'
            }
          ]
        };

        expect(expectedResult).to.deep.equal(actualResult);
      }
    });

    it('Should return revert dont have event store', async () => {
      await ct.connect(user1).createEventStore('title group 1')
      await expect(ct.connect(user1).addEventStore(
        1,
        1,
        10,
        20,
        `title group 0`,
        `title 1`,
        'test',
        '0-30'
      )).to.be.revertedWith("Invalid store title");
    });
  });

  describe("Edit Event Store Title only title", () => {
    it('Should return event store title changed',async () => {
      const titleChanged = 'title changed group 1'
      await ct.createEventStore('title group 1');
      await ct.connect(user1).editEventStoreTitle(0, titleChanged);

      const events = await ct.connect(user1).getEventTitle();
      const actualResult = events.map((event: any) => ({
        title: event[0],
        parctitipationAmount: event[1].toNumber()
      }));
      const eventExpected = [{ title: titleChanged, parctitipationAmount: 0 }];

      expect(eventExpected).to.deep.equal(actualResult) 
    })
  });

  describe("Edit Event Schedule data by id", () => {
    it('Should return event schedule data changded', async () => {
      await ct.connect(user1).createEventStore('title group 1');
      await ct.connect(user1).addEventStore(
        1,
        1,
        10,
        20,
        `title group 1`,
        `title 1`,
        'test',
        '0-30'
      );
      await ct.connect(user1).editEventSchedule(
        0,
        1,
        0,
        30,
        '0-30',
        'title changed 1'
      );

      const eventStores = await ct.connect(user1).getEventStore(0, '0-30');
      const eventSchedule = eventStores[2].map((event: any) => ({
        day: event[0].toNumber(),
        id: event[1].toNumber(),
        start_event: event[2].toNumber(),
        end_event: event[3].toNumber(),
        title: event[4],
        description: event[5]
      }));
      const actualResult = {
        title: eventStores[0],
        accounts: eventStores[1],
        eventSchedule: eventSchedule
      };

      const expectedResult = {
        title: 'title group 1',
        accounts: [],
        eventSchedule: [
          {
            day: 1,
            id: 1,
            start_event: 10,
            end_event: 30,
            title: 'title changed 1',
            description: 'test'
          }
        ]
      }

      expect(expectedResult).to.deep.equal(actualResult);
    });

    it('Should return reject with array out of bounds', async () => {
      await ct.connect(user1).createEventStore('title group 1');
      await ct.connect(user1).addEventStore(
        1,
        1,
        10,
        20,
        'title group 1',
        "title 1",
        "test",
        "0-30"
      );

      const rejectWord = 'Array accessed at an out-of-bounds or negative index';
      await expect(ct.connect(user1).editEventSchedule(
        4,
        1,
        0,
        30,
        "0-30",
        "changed",
      )).to.be.rejectedWith(rejectWord);
    });
  });

  describe("Delete Event Schedule by event id", () => {
    it("Should return delete event schedule", async () => {
      await ct.connect(user1).createEventStore('title group 1');

      for (let i = 1; i < 5; i++) {
        await ct.connect(user1).addEventStore(
          i,
          i,
          10,
          20,
          `title group 1`,
          `title ${i}`,
          'test',
          '0-30'
        );
      }

      ct.connect(user1).deleteEventSchedule(0, 1, "0-30");

      const eventStores = await ct.connect(user1).getEventStore(0, '0-30');      
      const eventSchedule = eventStores[2].map((event: any) => ({
        day: event[0].toNumber(),
        id: event[1].toNumber(),
        start_event: event[2].toNumber(),
        end_event: event[3].toNumber(),
        title: event[4],
        description: event[5]
      }));
      const actualResult = {
        title: eventStores[0],
        accounts: eventStores[1],
        eventSchedule
      };

      const expectedResult = {
        title: 'title group 1',
        accounts: [],
        eventSchedule: [
          {
            day: 4,
            id: 4,
            start_event: 10,
            end_event: 20,
            title: 'title 4',
            description: 'test'
          },
          {
            day: 2,
            id: 2,
            start_event: 10,
            end_event: 20,
            title: 'title 2',
            description: 'test'
          },
          {
            day: 3,
            id: 3,
            start_event: 10,
            end_event: 20,
            title: 'title 3',
            description: 'test'
          }
        ]
      };

      expect(expectedResult).to.deep.equal(actualResult);
    });
  });

  describe('Invite participation by address', () => {
    it('Should return invitation address', async () => {
      await ct.connect(user1).createEventStore('title group 1');
      await ct.connect(user1).addEventStore(
        1,
        1,
        10,
        20,
        'title group 1',
        "title 1",
        "test",
        "0-30"
      );

      const invitation_account = await user2.getAddress();
      await ct.connect(user1).inviteParticipation(
        0,
        'title group 1',
        invitation_account
      );

      const eventsUser2 = await ct.connect(user2).getParticipationTitle();
      const actualResultUser2 = eventsUser2.map((event: any) => ({
        title: event[0],
        store_index: event[1].toNumber(),
        createdBy: event[2]
      }));

      const eventStores = await ct.connect(user2).getParticipationStore(
        0, 
        'title group 1',
        '0-30', 
      );

      const eventSchedules = eventStores[2].map((event: any) => ({
        day: event[0].toNumber(),
        id: event[1].toNumber(),
        start_event: event[2].toNumber(),
        end_event: event[3].toNumber(),
        title: event[4],
        description: event[5]
      }));

      const actualResult = {
        title: eventStores[0],
        accounts: eventStores[1],
        eventSchedules
      };

      const expectedResult = {
        title: 'title group 1',
        accounts: [ '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' ],
        eventSchedules: [
          {
            day: 1,
            id: 1,
            start_event: 10,
            end_event: 20,
            title: 'title 1',
            description: 'test'
          }
        ]
      };

      expect(expectedResult).to.deep.equal(actualResult);
    });
  });

  describe('Leave Participation by index and title', () => {
    it('Should return leave participation success', async () => {
      const store_index = 0;
      const store_title = 'title group 1';
      await ct.connect(user1).createEventStore(store_title);
      await ct.connect(user1).addEventStore(
        1,
        1,
        10,
        20,
        store_title,
        "title 1",
        "test",
        "0-30"
      );

      const invitation_account = await user2.getAddress();
      await ct.connect(user1).inviteParticipation(
        store_index,
        store_title,
        invitation_account
      );

      const eventsUser2 = await ct.connect(user2).getParticipationTitle();
      const actualResultUser2 = eventsUser2.map((event: any) => ({
        title: event[0],
        store_index: event[1].toNumber(),
        createdBy: event[2]
      }));

      const eventStores = await ct.connect(user2).getParticipationStore(
        store_index, 
        store_title,
        '0-30', 
      );

      const eventSchedules = eventStores[2].map((event: any) => ({
        day: event[0].toNumber(),
        id: event[1].toNumber(),
        start_event: event[2].toNumber(),
        end_event: event[3].toNumber(),
        title: event[4],
        description: event[5]
      }));

      const actualResult = {
        title: eventStores[0],
        accounts: eventStores[1],
        eventSchedules
      };

      // console.log('BEFORE LEAVE');
      // console.log(actualResultUser2);
      // console.log();
      // console.log(actualResult);

      // LEAVE
      await ct.connect(user2).leaveParticipationEvent(store_index, store_title);
      const eventsUser2Leave = await ct.connect(user2).getParticipationTitle();
      const actualResultUser2Leave = eventsUser2Leave.map((event: any) => ({
        title: event[0],
        store_index: event[1].toNumber(),
        createdBy: event[2]
      }));

      const eventStoresUser1 = await ct.connect(user1).getEventStore(0, '0-30');

      const eventScheduleUser1 = eventStores[2].map((event: any) => ({
        day: event[0].toNumber(),
        id: event[1].toNumber(),
        start_event: event[2].toNumber(),
        end_event: event[3].toNumber(),
        title: event[4],
        description: event[5]
      }));

      const actualResultUser1 = {
        title: eventStoresUser1[0],
        accounts: eventStoresUser1[1],
        eventSchedule: eventScheduleUser1
      };
      
      // console.log('AFTER LEAVE');
      // console.log(actualResultUser2Leave);
      // console.log();
      // console.log(actualResultUser1);

      const expetcedUser2Participation: any[] = [];
      const expectedUser1AccountParticipation = {
        title: 'title group 1',
        accounts: [],
        eventSchedule: [
          {
            day: 1,
            id: 1,
            start_event: 10,
            end_event: 20,
            title: 'title 1',
            description: 'test'
          }
        ]
      };

      expect(expetcedUser2Participation).to.deep.equal(actualResultUser2Leave);
      expect(expectedUser1AccountParticipation).to.deep.equal(actualResultUser1);
    });
  })
})