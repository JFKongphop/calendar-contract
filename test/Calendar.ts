import { Signer } from 'ethers';
import { expect } from "chai";
import { ethers} from "hardhat";
import { Calendar } from '../typechain-types';

const titleGroup1OfEventStore = 'title group 1';
const coverImageCID = 'QmSvSnF1S2NQKDjLe9yBmkK4Mv2u8nhfbfmTEzmLhFTRZV';
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

type EventTitleStructOutput = Calendar.EventTitleStructOutput;
type EventScheduleStructOutput = Calendar.EventScheduleStructOutput;
type EventStoreRetrivedStructOutput = Calendar.EventStoreRetrivedStructOutput;
type ParticipationStoreStructOutput = Calendar.ParticipationStoreStructOutput;

describe('Calendar', async () => {
  let user1: Signer, user2: Signer, user3: Signer;
  let ct: Calendar;

  beforeEach(async () => {
    [user1, user2] = await ethers.getSigners();

    const LibraryContract = await ethers.getContractFactory('Library');
    const libraryContract = await LibraryContract.deploy();
    const libraryAddress = await libraryContract.getAddress();
    
    const CalendarContract = await ethers.getContractFactory('Calendar', {
      libraries: {
        Library: libraryAddress,
      }
    });

    ct = await CalendarContract.deploy();
    ct.deploymentTransaction()
  })

  // it('Should test', async () => {
  //   await ct.connect(user1).createEventStore(titleGroup1OfEventStore, coverImageCID);

  //   const events = await ct.connect(user2).getEventTitle();
  //   const actualResult = events.map((event: any) => ({
  //     title: event[0],
  //     coverImageCID: event[1],
  //     parctitipationAmount: Number(event[2])
  //   }));

  //   console.log(actualResult)

  //   // const eventExpected = [
  //   //   {
  //   //     title: titleGroup1OfEventStore, 
  //   //     coverImageCID,
  //   //     parctitipationAmount: 0 
  //   //   }
  //   // ];

  //   // expect(eventExpected).to.deep.equal(actualResult) 
  // })

  // beforeEach(async () => {
  //   [user1, user2, user3] = await ethers.getSigners();

  //   const CompareLibrary = await ethers.getContractFactory('Library');
  //   const compareLibrary = await CompareLibrary.deploy();
  //   await compareLibrary.deployed();

  //   const CalendarContract = await ethers.getContractFactory('Calendar', {
  //     libraries: {
  //       Library: compareLibrary.address
  //     },
  //   });
    
  //   ct = await CalendarContract.deploy();
  //   await ct.deployed();
  // });

  describe('Create Event Store only title', () => {
    beforeEach(async () => {
      await ct.connect(user1).createEventStore(titleGroup1OfEventStore, coverImageCID);
    })

    it('Should return title of event store array', async () => {
      const events: EventTitleStructOutput[] = await ct.connect(user1).getEventTitle();
      const actualResult = events.map((event) => ({
        title: event[0],
        coverImageCID: event[1],
        parctitipationAmount: Number(event[2])
      }));

      const eventExpected = [
        {
          title: titleGroup1OfEventStore, 
          coverImageCID,
          parctitipationAmount: 0 
        }
      ];

      expect(eventExpected).to.deep.equal(actualResult) 
    });

    it('Should return lenght of event title array', async () => {
      const eventTitles: EventTitleStructOutput[] = await ct.connect(user1).getEventTitle();
      
      const lenghtOfEventStore = eventTitles.map((event) => ({
        title: event[0],
        parctitipationAmount: event[1],
      })).length;

      expect(1).to.equal(lenghtOfEventStore);
    });

    it('Should revert of limitation require 5 event store', async () => {
      for(let i = 0; i < 5; i++) {
        await ct.connect(user1).createEventStore(`title ${i}`, coverImageCID);
      }

      const revertWord = 'Limitation to create event store';
      await expect(ct
        .connect(user1)
        .createEventStore('', coverImageCID)
      ).to.be.revertedWith(revertWord);
    });

    it('Should revert of invalid title', async () => {
      const revertWord = 'Invalid title';
      await expect(ct
        .connect(user1)
        .createEventStore('', coverImageCID)
      ).to.be.revertedWith(revertWord);    
    });

    it('Should revert of limitation create event', async () => {
      const revertWord = 'Cannot create duplicate name of event store';
      await expect(ct.
        connect(user1).
        createEventStore(titleGroup1OfEventStore, coverImageCID)
      ).to.be.revertedWith(revertWord);      
    });
  });

  describe('Add Event Store all event data', () => {
    beforeEach(async () => {
      await ct
        .connect(user1)
        .createEventStore(titleGroup1OfEventStore, coverImageCID);
    });

    it('Should return event store array', async () => {
      const id = Date.now();

      await ct.connect(user1).addEventSchedule(
        id,
        10,
        20,
        0,
        titleGroup1OfEventStore,
        title1EventSchedule,
        month_range
      );

      const eventStores: EventStoreRetrivedStructOutput = await ct
        .connect(user1)
        .getEventSchedule(0, month_range);

      const eventSchedule = eventStores[2].map((event) => ({
        id: Number(event[0]),
        start_event: Number(event[1]),
        end_event: Number(event[2]),
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

    it('Should revert dont have event store', async () => {
      const notFoundTitle = 'title group 0';
      await expect(ct.connect(user1).addEventSchedule(
        1,
        10,
        20,
        0,
        notFoundTitle,
        title1EventSchedule,
        month_range
      )).to.be.revertedWith("Invalid store title");
    });
  });

  describe("Edit Event Store Title only title", () => {
    it('Should return event store title changed',async () => {
      const storeTitleChange = 'title changed group 1'
      await ct.createEventStore(titleGroup1OfEventStore, coverImageCID);
      await ct.connect(user1).editEventStoreTitle(0, storeTitleChange);

      const events = await ct.connect(user1).getEventTitle();
      const actualResult = events.map((event: any) => ({
        title: event[0],
        coverImageCID: event[1],
        parctitipationAmount: Number(event[2]),
      }));

      const eventExpected = [
        {
          title: storeTitleChange, 
          coverImageCID,
          parctitipationAmount: 0 
        }
      ];

      expect(eventExpected).to.deep.equal(actualResult);
    });

    it('Should revert create event duplcate title group of event calendar', async () => {
      const revertWord = 'Cannot create duplicate name of event store';
      await ct.createEventStore(titleGroup1OfEventStore, coverImageCID);
      await expect(
        ct.createEventStore(titleGroup1OfEventStore, coverImageCID)
      ).to.be.revertedWith(revertWord);
    });

    it('Should revert edit event deuplicate title group of event calendar', async () => {
      const revertWord = 'Duplicate name or event calendar';
      await ct.createEventStore(titleGroup1OfEventStore, coverImageCID);
      await expect(
        ct.connect(user1).editEventStoreTitle(0, titleGroup1OfEventStore)
      ).to.be.revertedWith(revertWord);
    })
  });

  describe("Edit Event Schedule data by id", () => {
    it('Should return event schedule data changded', async () => {
      const scheduleTitleChange = 'title changed 1'
      await ct.connect(user1).createEventStore(titleGroup1OfEventStore, coverImageCID);
      await ct.connect(user1).addEventSchedule(
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

      const eventStores: EventStoreRetrivedStructOutput = await ct.
        connect(user1).
        getEventSchedule(0, month_range);

      const eventSchedule = eventStores[2].map((event) => ({
        id: Number(event[0]),
        start_event: Number(event[1]),
        end_event: Number(event[2]),
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
      await ct.connect(user1).createEventStore(titleGroup1OfEventStore, coverImageCID);
      await ct.connect(user1).addEventSchedule(
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
      await ct.connect(user1).createEventStore(titleGroup1OfEventStore, coverImageCID);

      for (let i = 0; i < timelineValidTestCases.length; i++) {
        await ct.connect(user1).addEventSchedule(
          i + 1,
          timelineValidTestCases[i].start_event,
          timelineValidTestCases[i].end_event,
          0,
          titleGroup1OfEventStore,
          `title ${i + 1}`,
          month_range
        );
      }

      await ct.connect(user1).deleteEventSchedule(0, 1, month_range);

      const eventStores: EventStoreRetrivedStructOutput = await ct.
        connect(user1).
        getEventSchedule(0, month_range);      
      const eventSchedule = eventStores[2].map((event) => ({
        id: Number(event[0]),
        start_event: Number(event[1]),
        end_event: Number(event[2]),
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
    let createdAddress: string, invitationAddress: string;
    beforeEach(async () => {
      await ct.connect(user1).createEventStore(titleGroup1OfEventStore, coverImageCID);
      await ct.connect(user1).addEventSchedule(
        1,
        10,
        20,
        0,
        titleGroup1OfEventStore,
        title1EventSchedule,
        month_range
      );

      createdAddress = await user1.getAddress();
      invitationAddress = await user2.getAddress();

      await ct.connect(user1).inviteParticipation(
        0,
        titleGroup1OfEventStore,
        invitationAddress
      );
    })

    it('Should return event participation title by invitation', async () => {
      const eventsUser2: ParticipationStoreStructOutput[] = await ct.
        connect(user2).
        getParticipationTitle();
      const actualResultEventTitle = eventsUser2.map((event) => ({
        title: event[0],
        store_index: Number(event[1]),
        createdBy: event[2]
      }));
  
      const expectedResultUser2 = [
        {
          title: titleGroup1OfEventStore,
          store_index: 0,
          createdBy: createdAddress,
        }
      ];
  
      expect(expectedResultUser2).to.deep.equal(actualResultEventTitle);
    })
    
    it('Should return paticipation event schedule by invitation', async () => {
      const eventStores: EventStoreRetrivedStructOutput = await ct.
        connect(user2).
        getParticipationStore(0, titleGroup1OfEventStore, month_range);
      const eventSchedules = eventStores[2].map((event) => ({
        id: Number(event[0]),
        start_event: Number(event[1]),
        end_event: Number(event[2]),
        title: event[3],
      }));

      const actualResult = {
        title: eventStores[0],
        accounts: eventStores[1],
        eventSchedules
      };

      const expectedResult = {
        title: titleGroup1OfEventStore,
        accounts: [invitationAddress],
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

    it('Should revert invalid store index', async () => {
      await ct.connect(user1).addEventSchedule(
        1,
        10,
        20,
        0,
        titleGroup1OfEventStore,
        title1EventSchedule,
        month_range
      );

      await expect(
        ct.connect(user1).inviteParticipation(
          1,
          titleGroup1OfEventStore,
          invitationAddress
        )
      ).to.be.revertedWith('Invalid store index');
    });

    it('Should revert cannot invite owner', async () => {
      const revertWord = 'Cannot invite owner';
      await expect(
        ct.connect(user1).inviteParticipation(
         0,
         titleGroup1OfEventStore,
         createdAddress
       )
      ).to.be.revertedWith(revertWord);
    });

    it('Should revert cannot invite duplicate address',  async () => {
      const revertWord = 'Cannot invite duplicate address';
      await expect(
        ct.connect(user1).inviteParticipation(
         0,
         titleGroup1OfEventStore,
         invitationAddress
       )
      ).to.be.revertedWith(revertWord);
    });
  });

  // describe('Leave Participation by index and title', () => {
  //   it('Should return leave participation success', async () => {
  //     const store_index = 0;
  //     await ct.connect(user1).createEventStore(titleGroup1OfEventStore, coverImageCID);
  //     await ct.connect(user1).addEventSchedule(
  //       1,
  //       10,
  //       20,
  //       0,
  //       titleGroup1OfEventStore,
  //       title1EventSchedule,
  //       month_range
  //     );

  //     const invitation_account = await user2.getAddress();
  //     await ct.connect(user1).inviteParticipation(
  //       store_index,
  //       titleGroup1OfEventStore,
  //       invitation_account
  //     );

  //     const eventsUser2 = await ct.connect(user2).getParticipationTitle();
  //     const actualResultUser2 = eventsUser2.map((event: any) => ({
  //       title: event[0],
  //       store_index: event[1].toNumber(),
  //       createdBy: event[2]
  //     }));

  //     const eventStores = await ct.connect(user2).getParticipationStore(
  //       store_index, 
  //       titleGroup1OfEventStore,
  //       month_range, 
  //     );

  //     const eventSchedules = eventStores[2].map((event: any) => ({
  //       id: event[0].toNumber(),
  //       start_event: event[1].toNumber(),
  //       end_event: event[2].toNumber(),
  //       title: event[3],
  //     }));

  //     const actualResult = {
  //       title: eventStores[0],
  //       accounts: eventStores[1],
  //       eventSchedules
  //     };

  //     // console.log('BEFORE LEAVE');
  //     // console.log(actualResultUser2);
  //     // console.log();
  //     // console.log(actualResult);

  //     // LEAVE
  //     await ct.connect(user2).leaveParticipationEvent(store_index, titleGroup1OfEventStore);
  //     const eventsUser2Leave = await ct.connect(user2).getParticipationTitle();
  //     const actualResultUser2Leave = eventsUser2Leave.map((event: any) => ({
  //       title: event[0],
  //       store_index: event[1].toNumber(),
  //       createdBy: event[2]
  //     }));

  //     const eventStoresUser1 = await ct.connect(user1).getEventSchedule(0, month_range);

  //     const eventScheduleUser1 = eventStores[2].map((event: any) => ({
  //       id: event[0].toNumber(),
  //       start_event: event[1].toNumber(),
  //       end_event: event[2].toNumber(),
  //       title: event[3],
  //     }));

  //     const actualResultUser1 = {
  //       title: eventStoresUser1[0],
  //       accounts: eventStoresUser1[1],
  //       eventSchedule: eventScheduleUser1
  //     };
      
  //     // console.log('AFTER LEAVE');
  //     // console.log(actualResultUser2Leave);
  //     // console.log();
  //     // console.log(actualResultUser1);

  //     const expetcedUser2Participation: any[] = [];
  //     const expectedUser1AccountParticipation = {
  //       title: titleGroup1OfEventStore,
  //       accounts: [],
  //       eventSchedule: [
  //         {
  //           id: 1,
  //           start_event: 10,
  //           end_event: 20,
  //           title: title1EventSchedule
  //         }
  //       ]
  //     };

  //     expect(expetcedUser2Participation).to.deep.equal(actualResultUser2Leave);
  //     expect(expectedUser1AccountParticipation).to.deep.equal(actualResultUser1);
  //   });
  // });

  // describe('Delete event schedule by month range', () => {
  //   it('Should return delete event schedule by month range', async () => {
  //     await ct.connect(user1).createEventStore(titleGroup1OfEventStore, coverImageCID);
  //     await ct.connect(user1).addEventSchedule(
  //       1,
  //       10,
  //       20,
  //       0,
  //       titleGroup1OfEventStore,
  //       title1EventSchedule,
  //       month_range
  //     );

  //     const eventStoresBeforeDelete = await ct.connect(user1).getEventSchedule(0, month_range);      
  //     const eventScheduleBeforeDelete = eventStoresBeforeDelete[2].map((event: any) => ({
  //       id: event[0].toNumber(),
  //       start_event: event[1].toNumber(),
  //       end_event: event[2].toNumber(),
  //       title: event[3],
  //       description: event[4]
  //     }));
  //     const actualResultBeforeDelete = {
  //       title: eventStoresBeforeDelete[0],
  //       accounts: eventStoresBeforeDelete[1],
  //       eventSchedule: eventScheduleBeforeDelete
  //     };

  //     // console.log('BEFORE DELETE');
  //     // console.log(actualResultBeforeDelete)
  //     // console.log('AFTER DELETE');
  //     await ct.connect(user1).deleteEventScheduleMonth(0, month_range);

  //     const eventStoresAfterDelete = await ct.connect(user1).getEventSchedule(0, month_range);      
  //     const eventScheduleAfterDelete = eventStoresAfterDelete[2].map((event: any) => ({
  //       id: event[0].toNumber(),
  //       start_event: event[1].toNumber(),
  //       end_event: event[2].toNumber(),
  //       title: event[3],
  //     }));
  //     const actualResultAfterDelete = {
  //       title: eventStoresAfterDelete[0],
  //       accounts: eventStoresAfterDelete[1],
  //       eventSchedule: eventScheduleAfterDelete
  //     };

  //     const extectedResultAfterDeleted = { 
  //       title: titleGroup1OfEventStore, 
  //       accounts: [], 
  //       eventSchedule: [] 
  //     };

  //     expect(extectedResultAfterDeleted).to.deep.equal(actualResultAfterDelete);
  //   });

  //   it('Should revert invalid store index', async () => {
  //     const rejectWord = 'Arithmetic operation underflowed or overflowed outside of an unchecked block';
  //     await expect(
  //       ct.connect(user1).deleteEventScheduleMonth(1, month_range)
  //     ).to.be.rejectedWith(rejectWord);
  //   });
  // });

  // describe('Remove account participation by store_index and participation account', () => {
    
  //   it('Should return remove participation account', async () => {
  //     console.log('test', 'wofjfjoew')
  //     const store_index = 0;
  //     await ct.connect(user1).createEventStore(titleGroup1OfEventStore, coverImageCID);
  //     await ct.connect(user1).addEventSchedule(
  //       1,
  //       10,
  //       20,
  //       0,
  //       titleGroup1OfEventStore,
  //       title1EventSchedule,
  //       month_range
  //     );

  //     const invitation_account = await user2.getAddress();
  //     await ct.connect(user1).inviteParticipation(
  //       store_index,
  //       titleGroup1OfEventStore,
  //       invitation_account
  //     );

  //     const eventsUser1BeforeRemove = await ct.connect(user1).getEventTitle();
  //     const actualResultUser1BeforeRemove = eventsUser1BeforeRemove.map((event: any) => ({
  //       title: event[0],
  //       coverImageCID: event[1],
  //       parctitipationAmount: event[2].toNumber(),
  //     }));
  //     const user2TitleBeforeRemove = await ct.connect(user2).getParticipationTitle();
  //     const user2TitleActualBeforeRemove = user2TitleBeforeRemove.map((event: any) => ({
  //       title: event[0],
  //       store_index: event[1].toNumber(),
  //       createdBy: event[2]
  //     }));
      
  //     // Remove participation by owner event
  //     await ct.connect(user1).removeAccountParticipation(0, invitation_account);

  //     const eventsUser1AfterRemove = await ct.connect(user1).getEventTitle();
  //     const actualResultUser1AfterRemove = eventsUser1AfterRemove.map((event: any) => ({
  //       title: event[0],
  //       coverImageCID: event[1],
  //       parctitipationAmount: event[2].toNumber()
  //     }));
  //     const user2TitleAfterRemove = await ct.connect(user2).getParticipationTitle();
  //     const user2TitleActuaAfterRemove = user2TitleAfterRemove.map((event: any) => ({
  //       title: event[0],
  //       store_index: event[1].toNumber(),
  //       createdBy: event[2]
  //     }));

  //     const expectedResultEventStoreTitleUser1 = [
  //       { 
  //         title: 'title group 1', 
  //         coverImageCID,
  //         parctitipationAmount: 0 
  //       }
  //     ];
  //     const expectedResultParticipationTitleUser2: any[] = [];

  //     expect(actualResultUser1AfterRemove).to.deep.equal(expectedResultEventStoreTitleUser1);
  //     expect(user2TitleActuaAfterRemove).to.deep.equal(expectedResultParticipationTitleUser2)
  //   });
  // });

  // describe('Remove all accounts participation by store index', async () => {
  //   it('Should return remove all account participation successfully', async () => {
  //     const store_index = 0;
  //     await ct.connect(user1).createEventStore(titleGroup1OfEventStore, coverImageCID);
  //     await ct.connect(user1).addEventSchedule(
  //       1,
  //       10,
  //       20,
  //       0,
  //       titleGroup1OfEventStore,
  //       title1EventSchedule,
  //       month_range
  //     );

  //     const invitationAccount2 = await user2.getAddress();
  //     const invitationAccount3 = await user3.getAddress();
  //     await ct.connect(user1).inviteParticipation(
  //       store_index,
  //       titleGroup1OfEventStore,
  //       invitationAccount2
  //     );
  //     await ct.connect(user1).inviteParticipation(
  //       store_index,
  //       titleGroup1OfEventStore,
  //       invitationAccount3
  //     );
      
  //     const eventsUser1BeforeRemove = await ct.connect(user1).getEventTitle();
  //     const actualResultUser1BeforeRemove = eventsUser1BeforeRemove.map((event: any) => ({
  //       title: event[0],
  //       coverImageCID: event[1],
  //       parctitipationAmount: event[2].toNumber(),
  //       eventParticipationAccounts: event[3]
  //     }));

  //     const user2TitleBeforeRemove = await ct.connect(user2).getParticipationTitle();
  //     const user2TitleActualBeforeRemove = user2TitleBeforeRemove.map((event: any) => ({
  //       title: event[0],
  //       store_index: event[1].toNumber(),
  //       createdBy: event[2]
  //     }));
  //     const user3TitleBeforeRemove = await ct.connect(user3).getParticipationTitle();
  //     const user3TitleActualBeforeRemove = user3TitleBeforeRemove.map((event: any) => ({
  //       title: event[0],
  //       store_index: event[1].toNumber(),
  //       createdBy: event[2]
  //     }));

  //     // Remove all participation accounts
  //     await ct.connect(user1).removeAllAccountParticipations(0);

  //     const eventsUser1AfterRemove = await ct.connect(user1).getEventTitle();
  //     const actualResultUser1AfterRemove = eventsUser1AfterRemove.map((event: any) => ({
  //       title: event[0],
  //       coverImageCID: event[1],
  //       parctitipationAmount: event[2].toNumber(),
  //       eventParticipationAccounts: event[3]
  //     }));

  //     const user2TitleAfterRemove = await ct.connect(user2).getParticipationTitle();
  //     const user2TitleActuaAfterRemove = user2TitleAfterRemove.map((event: any) => ({
  //       title: event[0],
  //       store_index: event[1].toNumber(),
  //       createdBy: event[2]
  //     }));
  //     const user3TitleAfterRemove = await ct.connect(user3).getParticipationTitle();
  //     const user3TitleActuaAfterRemove = user3TitleAfterRemove.map((event: any) => ({
  //       title: event[0],
  //       store_index: event[1].toNumber(),
  //       createdBy: event[2]
  //     }));

  //     const expectedResultEventStoreTitleUser1 = [
  //       { 
  //         title: 'title group 1',
  //         coverImageCID,
  //         parctitipationAmount: 0,
  //         eventParticipationAccounts: []
  //       }
  //     ];
  //     const expectedResultParticipationTitleUser2: any[] = [];
  //     const expectedResultParticipationTitleUser3: any[] = [];

  //     expect(expectedResultEventStoreTitleUser1).to.deep.equal(expectedResultEventStoreTitleUser1);
  //     expect(expectedResultParticipationTitleUser2).to.deep.equal(user2TitleActuaAfterRemove);
  //     expect(expectedResultParticipationTitleUser3).to.deep.equal(user3TitleActuaAfterRemove);
  //   });

  //   it('Should revert remove all account partcipation by invalid store index', async () => {
  //     const store_index = 0;
  //     await ct.connect(user1).createEventStore(titleGroup1OfEventStore, coverImageCID);
  //     await ct.connect(user1).addEventSchedule(
  //       1,
  //       10,
  //       20,
  //       0,
  //       titleGroup1OfEventStore,
  //       title1EventSchedule,
  //       month_range
  //     );

  //     const invitationAccount2 = await user2.getAddress();
  //     await ct.connect(user1).inviteParticipation(
  //       store_index,
  //       titleGroup1OfEventStore,
  //       invitationAccount2
  //     );

  //     await expect(
  //       ct.connect(user1).removeAllAccountParticipations(1)
  //     ).to.revertedWith('Invalid store index');
  //   });
  // });
})