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
    [user1, user2, user3] = await ethers.getSigners();

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
      await expect(ct
        .connect(user1)
        .createEventStore(titleGroup1OfEventStore, coverImageCID)
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
      const revertWord = 'Invalid store title';
      await expect(ct.connect(user1).addEventSchedule(
        1,
        10,
        20,
        0,
        notFoundTitle,
        title1EventSchedule,
        month_range
      )).to.be.revertedWith(revertWord);
    });
  });

  describe("Edit Event Store Title only title", () => {
    beforeEach(async () => {
      await ct.connect(user1).createEventStore(titleGroup1OfEventStore, coverImageCID);
    })

    it('Should return event store title changed',async () => {
      const storeTitleChange = 'title changed group 1'
      await ct.connect(user1).editEventStoreTitle(0, storeTitleChange);

      const events: EventTitleStructOutput[] = await ct.connect(user1).getEventTitle();
      const actualResult = events.map((event) => ({
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
      await expect(ct
        .connect(user1)
        .createEventStore(titleGroup1OfEventStore, coverImageCID)
      ).to.be.revertedWith(revertWord);
    });

    it('Should revert edit event deuplicate title group of event calendar', async () => {
      const revertWord = 'Duplicate name or event calendar';
      await expect(ct
        .connect(user1)
        .editEventStoreTitle(0, titleGroup1OfEventStore)
      ).to.be.revertedWith(revertWord);
    })
  });

  describe("Edit Event Schedule data by id", () => {
    beforeEach(async () => {
      await ct
        .connect(user1)
        .createEventStore(titleGroup1OfEventStore, coverImageCID);
    })

    it('Should return event schedule data changded', async () => {
      const scheduleTitleChange = 'title changed 1'
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
      await ct
        .connect(user1)
        .createEventStore(titleGroup1OfEventStore, coverImageCID);

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

      await ct
        .connect(user1)
        .deleteEventSchedule(0, 1, month_range);

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
      await ct
        .connect(user1)
        .createEventStore(titleGroup1OfEventStore, coverImageCID);

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
      const eventsUser2: ParticipationStoreStructOutput[] = await ct
        .connect(user2)
        .getParticipationTitle();

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
      const eventStores: EventStoreRetrivedStructOutput = await ct
        .connect(user2)
        .getParticipationStore(0, titleGroup1OfEventStore, month_range);

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

      await expect(ct.connect(user1).inviteParticipation(
        1,
        titleGroup1OfEventStore,
        invitationAddress
      )).to.be.revertedWith('Invalid store index');
    });

    it('Should revert cannot invite owner', async () => {
      const revertWord = 'Cannot invite owner';
      await expect(ct.connect(user1).inviteParticipation(
        0,
        titleGroup1OfEventStore,
        createdAddress
      )).to.be.revertedWith(revertWord);
    });

    it('Should revert cannot invite duplicate address',  async () => {
      const revertWord = 'Cannot invite duplicate address';
      await expect(ct.connect(user1).inviteParticipation(
        0,
        titleGroup1OfEventStore,
        invitationAddress
      )).to.be.revertedWith(revertWord);
    });
  });

  describe('Leave Participation by index and title', () => {
    const store_index = 0;
    beforeEach(async () => {
      await ct
        .connect(user1)
        .createEventStore(titleGroup1OfEventStore, coverImageCID);
      await ct.connect(user1).addEventSchedule(
        1,
        10,
        20,
        0,
        titleGroup1OfEventStore,
        title1EventSchedule,
        month_range
      );

      const invitationAddress = await user2.getAddress();
      await ct.connect(user1).inviteParticipation(
        store_index,
        titleGroup1OfEventStore,
        invitationAddress
      );
    })

    it('Should return empty participation from created after participation left', async () => {
      await ct
        .connect(user2)
        .leaveParticipationEvent(store_index, titleGroup1OfEventStore);
      const eventsUser: EventStoreRetrivedStructOutput = await ct
        .connect(user1)
        .getEventSchedule(store_index, month_range);

      const eventSchedule = eventsUser[2].map((event) => ({
        id: Number(event[0]),
        start_event: Number(event[1]),
        end_event: Number(event[2]),
        title: event[3],
      }));
      
      const actualResult = {
        title: titleGroup1OfEventStore,
        accounts: eventsUser[1],
        eventSchedule
      }

      const expectedUserAccountParticipation = {
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

      expect(expectedUserAccountParticipation).to.deep.equal(actualResult)      
    })

    it('Should return empty event schedule from invited participate', async () => {
      await ct
        .connect(user2)
        .leaveParticipationEvent(store_index, titleGroup1OfEventStore);
      const eventsUser2Leave: ParticipationStoreStructOutput[] = await ct
        .connect(user2)
        .getParticipationTitle();
      
      const actualResultUser2Leave = eventsUser2Leave.map((event) => ({
        title: event[0],
        store_index: Number(event[1]),
        createdBy: event[2]
      }));

      const expetcedUser2Participation: unknown[] = [];

      expect(expetcedUser2Participation).to.deep.equal(actualResultUser2Leave);
    })
  });

  describe('Delete event schedule by month range', () => {
    it('Should return delete event schedule by month range', async () => {
      await ct
        .connect(user1)
        .createEventStore(titleGroup1OfEventStore, coverImageCID);
      await ct.connect(user1).addEventSchedule(
        1,
        10,
        20,
        0,
        titleGroup1OfEventStore,
        title1EventSchedule,
        month_range
      );

      await ct
        .connect(user1)
        .deleteEventScheduleMonth(0, month_range);

      const eventsUser: EventStoreRetrivedStructOutput = await ct
        .connect(user1)
        .getEventSchedule(0, month_range);   
      
      const eventSchedule = eventsUser[2].map((event: any) => ({
        id: Number(event[0]),
        start_event: Number(event[1]),
        end_event: Number(event[2]),
        title: event[3],
      }));

      const actualResultAfterDelete = {
        title: eventsUser[0],
        accounts: eventsUser[1],
        eventSchedule,
      };

      const extectedResultAfterDeleted = { 
        title: titleGroup1OfEventStore, 
        accounts: [], 
        eventSchedule: [] 
      };

      expect(extectedResultAfterDeleted).to.deep.equal(actualResultAfterDelete);
    });
  });

  describe('Remove account participation by store_index and participation account', () => {
    it('Should return remove participation account', async () => {
      const store_index = 0;
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

      const invitationAddress = await user2.getAddress();
      await ct.connect(user1).inviteParticipation(
        store_index,
        titleGroup1OfEventStore,
        invitationAddress
      );
      
      await ct
        .connect(user1)
        .removeAccountParticipation(0, invitationAddress);

      const user2TitleAfterRemove: ParticipationStoreStructOutput[] = await ct
        .connect(user2)
        .getParticipationTitle();
      
      const user2TitleActuaAfterRemove = user2TitleAfterRemove.map((event: any) => ({
        title: event[0],
        store_index: Number(event[1]),
        createdBy: event[2]
      }));

      const expectedResultParticipationTitleUser2: any[] = [];

      expect(user2TitleActuaAfterRemove).to.deep.equal(expectedResultParticipationTitleUser2)
    });
  });

  describe('Remove all accounts participation by store index', async () => {
    const store_index = 0;
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
  
      const invitationAccount2 = await user2.getAddress();
      const invitationAccount3 = await user3.getAddress();

      await ct.connect(user1).inviteParticipation(
        store_index,
        titleGroup1OfEventStore,
        invitationAccount2
      );
      await ct.connect(user1).inviteParticipation(
        store_index,
        titleGroup1OfEventStore,
        invitationAccount3
      );

      await ct.connect(user1).removeAllAccountParticipations(0);
    })

    it('Should return empty participation event from user after creator remove all', async () => {
      const user2TitleAfterRemove: ParticipationStoreStructOutput[] = await ct
        .connect(user2)
        .getParticipationTitle();

      const user2TitleActuaAfterRemove = user2TitleAfterRemove.map((event) => ({
        title: event[0],
        store_index: Number(event[1]),
        createdBy: event[2]
      }));

      const user3TitleAfterRemove: ParticipationStoreStructOutput[] = await ct
        .connect(user3)
        .getParticipationTitle();

      const user3TitleActuaAfterRemove = user3TitleAfterRemove.map((event) => ({
        title: event[0],
        store_index: Number(event[1]),
        createdBy: event[2]
      }));

      const expectedResultParticipationTitleUser2: any[] = [];
      const expectedResultParticipationTitleUser3: any[] = [];

      expect(expectedResultParticipationTitleUser2).to.deep.equal(user2TitleActuaAfterRemove);
      expect(expectedResultParticipationTitleUser3).to.deep.equal(user3TitleActuaAfterRemove);
    })

    it('Should return empty participation account', async () => {
      const eventStores: EventTitleStructOutput[] = await ct
        .connect(user1)
        .getEventTitle();
      const actualResult = eventStores.map((event) => ({
        title: event[0],
        coverImageCID: event[1],
        parctitipationAmount: Number(event[2]),
        eventParticipationAccounts: event[3]
      }));

      const expectedResult = [
        { 
          title: 'title group 1',
          coverImageCID,
          parctitipationAmount: 0,
          eventParticipationAccounts: []
        }
      ];

      expect(expectedResult).to.deep.equal(actualResult);
    });

    it('Should revert remove all account partcipation by invalid store index', async () => {
      await expect(ct
        .connect(user1)
        .removeAllAccountParticipations(1)
      ).to.revertedWith('Invalid store index');
    });
  });
})