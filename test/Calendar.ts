import { Signer, Contract } from 'ethers';
import { expect } from "chai";
import { ethers } from "hardhat";

const titleGroup1OfEventStore = 'title group 1';
const title1EventSchedule = 'title 1';
const month_range = '0-30'
const timelineOverlapTestCases = [
  { start_event: 8, end_event: 10 },
  { start_event: 7, end_event: 11 },
  { start_event: 8, end_event: 11 },
  { start_event: 6, end_event: 11,},
  { start_event: 7, end_event: 12 },
  { start_event: 7, end_event: 10 },
  { start_event: 8, end_event: 12 },
  { start_event: 6, end_event: 10 },
];
const timelineValidTestCases = [
  { start_event: 1, end_event: 2 },
  { start_event: 2, end_event: 3 },
  { start_event: 3, end_event: 4 },
  { start_event: 4, end_event: 5,},
];

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
      await ct.createEventStore(titleGroup1OfEventStore);

      const events = await ct.connect(user1).getEventTitle();
      const actualResult = events.map((event: any) => ({
        title: event[0],
        parctitipationAmount: event[1].toNumber()
      }));

      const eventExpected = [
        {
          title: titleGroup1OfEventStore, 
          parctitipationAmount: 0 
        }
      ];

      expect(eventExpected).to.deep.equal(actualResult) 
    });

    it('Should return lenght of event title array', async () => {
      await ct.createEventStore(title1EventSchedule);
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
      await ct.createEventStore(titleGroup1OfEventStore);

      const revertWord = 'Cannot create duplicate name of event store';
      await expect(ct.createEventStore(titleGroup1OfEventStore))
      .to.be.revertedWith(revertWord);      
    });
  });

  describe('Add Event Store all event data', () => {
    it('Should return event store array', async () => {
      await ct.createEventStore(titleGroup1OfEventStore);
      const id = Date.now();

      await ct.connect(user1).addEventStore(
        id,
        10,
        20,
        0,
        titleGroup1OfEventStore,
        title1EventSchedule,
        month_range
      );

      const eventStores = await ct.connect(user1).getEventSchedule(0, month_range);

      const eventSchedule = eventStores[2].map((event: any) => ({
        id: event[0].toNumber(),
        start_event: event[1].toNumber(),
        end_event: event[2].toNumber(),
        title: event[3],
      }));
      const actualResult = {
        title: eventStores[0],
        accounts: eventStores[1],
        eventSchedule: eventSchedule
      };

      const expectedResult = {
        title: titleGroup1OfEventStore,
        accounts: [],
        eventSchedule: [
          {
            id,
            start_event: 10,
            end_event: 20,
            title: title1EventSchedule,
          },
        ]
      };

      expect(expectedResult).to.deep.equal(actualResult);
    });

    it('Should return revert dont have event store', async () => {
      const notFoundTitle = 'title group 0';
      await ct.connect(user1).createEventStore(titleGroup1OfEventStore)
      await expect(ct.connect(user1).addEventStore(
        1,
        10,
        20,
        0,
        notFoundTitle,
        title1EventSchedule,
        month_range
      )).to.be.revertedWith("Invalid store title");
    });

    it('Should return revert overlap time line of event', async () => {
      await ct.connect(user1).createEventStore(titleGroup1OfEventStore)
      await ct.connect(user1).addEventStore(
        Date.now(),
        7,
        11,
        0,
        titleGroup1OfEventStore,
        title1EventSchedule,
        month_range
      );

      for (let i = 0; i < timelineOverlapTestCases.length; i++) {
        await expect(ct.connect(user1).addEventStore(
          Date.now(),
          timelineOverlapTestCases[i].start_event,
          timelineOverlapTestCases[i].end_event,
          0,
          titleGroup1OfEventStore,
          title1EventSchedule,
          month_range
        )).to.be.revertedWith('Timeline of event is invalid');
      }
    });
  });

  describe("Edit Event Store Title only title", () => {
    it('Should return event store title changed',async () => {
      const storeTitleChange = 'title changed group 1'
      await ct.createEventStore(titleGroup1OfEventStore);
      await ct.connect(user1).editEventStoreTitle(0, storeTitleChange);

      const events = await ct.connect(user1).getEventTitle();
      const actualResult = events.map((event: any) => ({
        title: event[0],
        parctitipationAmount: event[1].toNumber()
      }));
      const eventExpected = [{ title: storeTitleChange, parctitipationAmount: 0 }];

      expect(eventExpected).to.deep.equal(actualResult);
    })
  });

  describe("Edit Event Schedule data by id", () => {
    it('Should return event schedule data changded', async () => {
      const scheduleTitleChange = 'title changed 1'
      await ct.connect(user1).createEventStore(titleGroup1OfEventStore);
      await ct.connect(user1).addEventStore(
        1,
        10,
        20,
        0,
        titleGroup1OfEventStore,
        title1EventSchedule,
        month_range
      );
      await ct.connect(user1).editEventSchedule(
        0,
        1,
        0,
        30,
        month_range,
        scheduleTitleChange
      );

      const eventStores = await ct.connect(user1).getEventSchedule(0, month_range);
      const eventSchedule = eventStores[2].map((event: any) => ({
        id: event[0].toNumber(),
        start_event: event[1].toNumber(),
        end_event: event[2].toNumber(),
        title: event[3],
      }));
      const actualResult = {
        title: eventStores[0],
        accounts: eventStores[1],
        eventSchedule: eventSchedule
      };

      const expectedResult = {
        title: titleGroup1OfEventStore,
        accounts: [],
        eventSchedule: [
          {
            id: 1,
            start_event: 10,
            end_event: 30,
            title: scheduleTitleChange
          }
        ]
      };

      expect(expectedResult).to.deep.equal(actualResult);
    });

    it('Should return reject with array out of bounds', async () => {
      await ct.connect(user1).createEventStore(titleGroup1OfEventStore);
      await ct.connect(user1).addEventStore(
        1,
        10,
        20,
        0,
        titleGroup1OfEventStore,
        title1EventSchedule,
        month_range
      );

      const rejectWord = 'Array accessed at an out-of-bounds or negative index';
      await expect(ct.connect(user1).editEventSchedule(
        4,
        1,
        0,
        30,
        month_range,
        "changed",
      )).to.be.rejectedWith(rejectWord);
    });
  });

  describe("Delete Event Schedule by event id", () => {
    it("Should return delete event schedule", async () => {
      await ct.connect(user1).createEventStore(titleGroup1OfEventStore);

      for (let i = 0; i < timelineValidTestCases.length; i++) {
        await ct.connect(user1).addEventStore(
          i + 1,
          timelineValidTestCases[i].start_event,
          timelineValidTestCases[i].end_event,
          0,
          titleGroup1OfEventStore,
          `title ${i + 1}`,
          month_range
        );
      }

      ct.connect(user1).deleteEventSchedule(0, 1, month_range);

      const eventStores = await ct.connect(user1).getEventSchedule(0, month_range);      
      const eventSchedule = eventStores[2].map((event: any) => ({
        id: event[0].toNumber(),
        start_event: event[1].toNumber(),
        end_event: event[2].toNumber(),
        title: event[3],
      }));
      const actualResult = {
        title: eventStores[0],
        accounts: eventStores[1],
        eventSchedule
      };

      const expectedResult = {
        title: titleGroup1OfEventStore,
        accounts: [],
        eventSchedule: [
          {
            id: 4,
            start_event: 4,
            end_event: 5,
            title: 'title 4'
          },
          {
            id: 2,
            start_event: 2,
            end_event: 3,
            title: 'title 2'
          },
          {
            id: 3,
            start_event: 3,
            end_event: 4,
            title: 'title 3'
          }
        ]
      };

      expect(expectedResult).to.deep.equal(actualResult);
    });
  });

  describe('Invite participation by address', () => {
    it('Should return invitation address', async () => {
      await ct.connect(user1).createEventStore(titleGroup1OfEventStore);
      await ct.connect(user1).addEventStore(
        1,
        10,
        20,
        0,
        titleGroup1OfEventStore,
        title1EventSchedule,
        month_range
      );

      const invitation_account = await user2.getAddress();
      await ct.connect(user1).inviteParticipation(
        0,
        titleGroup1OfEventStore,
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
        titleGroup1OfEventStore,
        month_range, 
      );

      const eventSchedules = eventStores[2].map((event: any) => ({
        id: event[0].toNumber(),
        start_event: event[1].toNumber(),
        end_event: event[2].toNumber(),
        title: event[3],
      }));

      const actualResult = {
        title: eventStores[0],
        accounts: eventStores[1],
        eventSchedules
      };

      const expectedResult = {
        title: titleGroup1OfEventStore,
        accounts: [ '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' ],
        eventSchedules: [
          {
            id: 1,
            start_event: 10,
            end_event: 20,
            title: title1EventSchedule
          }
        ]
      };

      expect(expectedResult).to.deep.equal(actualResult);
    });

    it('Should revert invitation address', async () => {
      await ct.connect(user1).createEventStore(titleGroup1OfEventStore);
      await ct.connect(user1).addEventStore(
        1,
        10,
        20,
        0,
        titleGroup1OfEventStore,
        title1EventSchedule,
        month_range
      );

      const invitation_account = await user2.getAddress();
      await expect(
        ct.connect(user1).inviteParticipation(
          1,
          titleGroup1OfEventStore,
          invitation_account
        )
      ).to.be.revertedWith('Invalid store index');
    });
  });

  describe('Leave Participation by index and title', () => {
    it('Should return leave participation success', async () => {
      const store_index = 0;
      await ct.connect(user1).createEventStore(titleGroup1OfEventStore);
      await ct.connect(user1).addEventStore(
        1,
        10,
        20,
        0,
        titleGroup1OfEventStore,
        title1EventSchedule,
        month_range
      );

      const invitation_account = await user2.getAddress();
      await ct.connect(user1).inviteParticipation(
        store_index,
        titleGroup1OfEventStore,
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
        titleGroup1OfEventStore,
        month_range, 
      );

      const eventSchedules = eventStores[2].map((event: any) => ({
        id: event[0].toNumber(),
        start_event: event[1].toNumber(),
        end_event: event[2].toNumber(),
        title: event[3],
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
      await ct.connect(user2).leaveParticipationEvent(store_index, titleGroup1OfEventStore);
      const eventsUser2Leave = await ct.connect(user2).getParticipationTitle();
      const actualResultUser2Leave = eventsUser2Leave.map((event: any) => ({
        title: event[0],
        store_index: event[1].toNumber(),
        createdBy: event[2]
      }));

      const eventStoresUser1 = await ct.connect(user1).getEventSchedule(0, month_range);

      const eventScheduleUser1 = eventStores[2].map((event: any) => ({
        id: event[0].toNumber(),
        start_event: event[1].toNumber(),
        end_event: event[2].toNumber(),
        title: event[3],
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
        title: titleGroup1OfEventStore,
        accounts: [],
        eventSchedule: [
          {
            id: 1,
            start_event: 10,
            end_event: 20,
            title: title1EventSchedule
          }
        ]
      };

      expect(expetcedUser2Participation).to.deep.equal(actualResultUser2Leave);
      expect(expectedUser1AccountParticipation).to.deep.equal(actualResultUser1);
    });
  });

  describe('Delete event schedule by month range', () => {
    it('Should return delete event schedule by month range', async () => {
      await ct.connect(user1).createEventStore(titleGroup1OfEventStore);
      await ct.connect(user1).addEventStore(
        1,
        10,
        20,
        0,
        titleGroup1OfEventStore,
        title1EventSchedule,
        month_range
      );

      const eventStoresBeforeDelete = await ct.connect(user1).getEventSchedule(0, month_range);      
      const eventScheduleBeforeDelete = eventStoresBeforeDelete[2].map((event: any) => ({
        id: event[0].toNumber(),
        start_event: event[1].toNumber(),
        end_event: event[2].toNumber(),
        title: event[3],
        description: event[4]
      }));
      const actualResultBeforeDelete = {
        title: eventStoresBeforeDelete[0],
        accounts: eventStoresBeforeDelete[1],
        eventSchedule: eventScheduleBeforeDelete
      };

      // console.log('BEFORE DELETE');
      // console.log(actualResultBeforeDelete)
      // console.log('AFTER DELETE');
      await ct.connect(user1).deleteEventScheduleMonth(0, month_range);

      const eventStoresAfterDelete = await ct.connect(user1).getEventSchedule(0, month_range);      
      const eventScheduleAfterDelete = eventStoresAfterDelete[2].map((event: any) => ({
        id: event[0].toNumber(),
        start_event: event[1].toNumber(),
        end_event: event[2].toNumber(),
        title: event[3],
      }));
      const actualResultAfterDelete = {
        title: eventStoresAfterDelete[0],
        accounts: eventStoresAfterDelete[1],
        eventSchedule: eventScheduleAfterDelete
      };

      const extectedResultAfterDeleted = { 
        title: titleGroup1OfEventStore, 
        accounts: [], 
        eventSchedule: [] 
      };

      expect(extectedResultAfterDeleted).to.deep.equal(actualResultAfterDelete);
    });

    it('Should return revert invalid store index', async () => {
      const rejectWord = 'Arithmetic operation underflowed or overflowed outside of an unchecked block';
      await expect(
        ct.connect(user1).deleteEventScheduleMonth(1, month_range)
      ).to.be.rejectedWith(rejectWord);
    });
  });
})