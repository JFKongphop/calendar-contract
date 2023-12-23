// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "./lib/Library.sol";

contract Calendar {
  struct EventSchedule {
    uint256 id;
    uint256 start_event;
    uint256 end_event;
    string title;
  }

  // for return title
  struct EventTitle {
    string title;
    uint256 parctitipationAmount;
    address[] parctitipationAccount;
    bool del;
  }

  // for return title of participation
  struct ParticipationTitle {
    string title;
    uint256 parctitipationAmount;
  }

  // for return event store struct not nested map
  struct EventStoreRetrived {
    string title;
    address[] accounts;
    EventSchedule[] eventSchedule;
  }

  struct EventStore {
    string title;
    address[] eventParticipationAccounts;
    bool deletedStatus;
    mapping(string => EventSchedule[]) eventSchedule; // month_range => event
  }

  struct EventInvitation {
    string title;
    EventStore[] eventStores;
  }

  struct ParticipationStore {
    string title;
    uint256 store_index;
    address createdBy;
  }

  struct EventParticipation {
    EventStore[] eventStores;
    ParticipationStore[] participationStores;
  }

  mapping(address => EventParticipation) calendarStore;

  /* ----- PRIVATE FUNCTION ----- */

  function _getEventByAccount (
    uint256 store_index,
    string memory month_range,
    address ownerAccount
  ) private view returns(EventStoreRetrived memory eventStoreRetrived) {
    EventStore storage userEventStore = calendarStore[ownerAccount].eventStores[store_index];

    string memory title = userEventStore.title;
    address[] storage accounts = userEventStore.eventParticipationAccounts;
    EventSchedule[] storage eventSchedule = userEventStore.eventSchedule[month_range];

    eventStoreRetrived.title = title;
    eventStoreRetrived.accounts = accounts;
    eventStoreRetrived.eventSchedule = eventSchedule;

    return eventStoreRetrived;
  }

  function _getOwnerEventAccount(
    uint256 store_index,
    string memory store_title
  ) private view returns(address ownerEventAccount) {
    ParticipationStore[] memory participationStores = calendarStore[msg.sender].participationStores;
    uint256 lengthOfParticipationStore = participationStores.length;
    for (uint256 i = 0; i < lengthOfParticipationStore; i++) {
      if (
        Library.compareString(participationStores[i].title, store_title)
        && (participationStores[i].store_index == store_index)
      ) {
        ownerEventAccount = participationStores[i].createdBy;
      }
    }

    return ownerEventAccount;
  }

  function _addEventParticipationAccount(
    uint256 store_index,
    address invitation_account
  ) private {
    calendarStore[msg.sender]
      .eventStores[store_index]
      .eventParticipationAccounts
      .push(invitation_account);
  }

  function _addParticipationStore(
    uint256 store_index,
    string memory title,
    address invitation_account
  ) private {
    calendarStore[invitation_account]
      .participationStores
      .push(ParticipationStore(
        title,
        store_index,
        msg.sender
      ));
  }

  function _deleteParticipationAccount(
    uint256 store_index,
    address ownerEventAccount
  ) private {
    address[] storage ownerEventParticipationAccounts = calendarStore[ownerEventAccount]
      .eventStores[store_index]
      .eventParticipationAccounts;
    uint256 lenghtOfParticipationAccount = ownerEventParticipationAccounts.length;
    address lastIndexAddress = ownerEventParticipationAccounts[lenghtOfParticipationAccount - 1];
    
    if (msg.sender == lastIndexAddress) {
      ownerEventParticipationAccounts.pop();
    }

    else {
      for (uint256 i = 0; i < lenghtOfParticipationAccount; i++) {
        if (msg.sender == ownerEventParticipationAccounts[i]) {
          ownerEventParticipationAccounts[i] = lastIndexAddress;
          ownerEventParticipationAccounts.pop();
          break;
        }
      }
    }
  }

  function _deleteParticipationStore(
    string memory store_title,
    address ownerEventAccount
  ) private {
    ParticipationStore[] memory ownerParticipationStores = calendarStore[msg.sender].participationStores;
    uint256 lengthOfOwnerParticipationStores = ownerParticipationStores.length;
    
    if (lengthOfOwnerParticipationStores > 0) {
      ParticipationStore memory lastIndexParticipationStore = ownerParticipationStores[lengthOfOwnerParticipationStores - 1];

      if (
        Library.compareString(lastIndexParticipationStore.title, store_title)
        && (lastIndexParticipationStore.createdBy == ownerEventAccount)
      ) {
        calendarStore[msg.sender].participationStores.pop();
      }

      else {
        for (uint256 i = 0; i < lengthOfOwnerParticipationStores; i++) {
          if (
            Library.compareString(ownerParticipationStores[i].title, store_title)
            && (ownerParticipationStores[i].createdBy == ownerEventAccount)
          ) {
            ownerParticipationStores[lengthOfOwnerParticipationStores - 1] = ownerParticipationStores[i];
            ownerParticipationStores[i] = lastIndexParticipationStore;

            calendarStore[msg.sender].participationStores.pop();
            break;
          }
        }
      }
    }

    else {
      calendarStore[msg.sender].participationStores.pop();
    }
  }

  /* ----- PUBLIC FUNCTION ----- */

  function createEventStore(string memory title) public returns(string memory) {
    EventStore[] storage userEventStores = calendarStore[msg.sender].eventStores;
    uint256 lengthOfEventStore = Library.getLengthOfEventStore(userEventStores);

    require(lengthOfEventStore <= 5, "Limitation to create event store");
    require(Library.getLengthOfString(title) > 0, "Invalid title");
    for (uint256 i = 0; i < lengthOfEventStore; i++) {
      require(
        !Library.compareString(userEventStores[i].title, title), 
        "Cannot create duplicate name of event store"
      );
    }

    EventStore storage newEventStore = userEventStores.push();
    newEventStore.title = title;
    newEventStore.deletedStatus = false;

    return "Create new event store successfully";
  }

  function addEventSchedule(
    uint256 id,
    uint256 start_event,
    uint256 end_event,
    uint256 store_index,
    string memory store_title,
    string memory title_event,
    string memory month_range
  ) public returns(string memory) {
    EventStore[] storage userEventStores = calendarStore[msg.sender].eventStores;
    EventSchedule[] storage userEventSchedules = userEventStores[store_index].eventSchedule[month_range];
    uint256 lengthOfEventStore = Library.getLengthOfEventStore(userEventStores);
    uint256 lengthOfEventSchedule = Library.getLengthOfEventSchedule(userEventSchedules);

    bool validEventTimeLine = Library.checkOverlapEventTimeline(
      lengthOfEventSchedule,
      start_event,
      end_event,
      userEventSchedules
    );

    for (uint256 i = 0; i < lengthOfEventStore; i++) {
      require(
        Library.compareString(userEventStores[i].title, store_title), 
        "Invalid store title"
      );
    }

    require(validEventTimeLine, "Timeline of event is invalid");

    EventSchedule memory newEvent = EventSchedule(
      id,
      start_event,
      end_event,
      title_event
    );

    userEventSchedules.push(newEvent);

    return "Add new event store successfully";
  }

  function getEventTitle() public view returns(EventTitle[] memory eventTitles) {
    EventStore[] storage userEventStores = calendarStore[msg.sender].eventStores;
    uint256 lengthOfUserEventStores = userEventStores.length;
    eventTitles = new EventTitle[](lengthOfUserEventStores);

    for (uint256 i = 0; i < lengthOfUserEventStores; i++) {
      eventTitles[i] = EventTitle(
        userEventStores[i].title,
        userEventStores[i].eventParticipationAccounts.length,
        userEventStores[i].eventParticipationAccounts,
        userEventStores[i].deletedStatus
      );
    }

    return eventTitles;
  }

  function getEventSchedule(
    uint256 store_index,
    string memory month_range
  ) public view returns(EventStoreRetrived memory eventStoreRetrived) {
    return _getEventByAccount(store_index, month_range, msg.sender);
  }

  function getParticipationTitle() public view returns (ParticipationStore[] memory) {
    return calendarStore[msg.sender].participationStores;
  }

  function getParticipationStore(
    uint256 store_index,
    string memory store_title,
    string memory month_range
  ) public view returns(EventStoreRetrived memory) {
    address ownerEventAccount = _getOwnerEventAccount(store_index, store_title);
    
    return _getEventByAccount(store_index, month_range, ownerEventAccount);
  }

  function editEventStoreTitle(
    uint256 store_index,
    string memory new_store_title
  ) public returns(string memory) {
    EventStore storage userEventStore = calendarStore[msg.sender].eventStores[store_index];
    userEventStore.title = new_store_title;

    return "Edit event store successfully";
  }

  function editEventSchedule(
    uint256 store_index,
    uint256 event_id,
    uint256 start_event,
    uint256 end_event,
    string memory month_range,
    string memory title
  ) public returns(string memory) {
    EventStore[] storage userEventStores = calendarStore[msg.sender].eventStores;
    EventStore storage eventStores = calendarStore[msg.sender].eventStores[store_index];

    uint256 lengthOfEventStore = Library.getLengthOfEventStore(userEventStores);
    uint256 lastIndexNumber = lengthOfEventStore - 1;

    require(store_index <= lastIndexNumber, "Invalid store index");

    EventSchedule[] storage eventSchedules = eventStores.eventSchedule[month_range];
    uint256 lengthOfEventSchedule = eventSchedules.length;

    for (uint256 i = 0; i < lengthOfEventSchedule; i++) {
      EventSchedule storage editingEvent = eventSchedules[i];
      if (editingEvent.id == event_id) {
        editingEvent.title = (Library.getLengthOfString(title) > 0) 
          ? title 
          :  eventSchedules[i].title;
        editingEvent.start_event = (start_event > 0) 
          ? start_event 
          : editingEvent.start_event;
        editingEvent.end_event = (end_event > 0) 
          ? end_event 
          : editingEvent.end_event;
        break;
      }
    }

    return "Edit event schedule successfully";
  }

  function inviteParticipation(
    uint256 store_index,
    string memory title,
    address invitation_account
  ) public returns(string memory) {
    EventStore[] storage userEventStores = calendarStore[msg.sender].eventStores;
    uint256 lenghtOfEventStore = Library.getLengthOfEventStore(userEventStores);
    require(store_index <= lenghtOfEventStore - 1, "Invalid store index");
    
    // add account to event owner
    _addEventParticipationAccount(store_index, invitation_account);
    // add event to who is participation
    _addParticipationStore(store_index, title, invitation_account);

    return "Invitation participation successfully";
  }

  function deleteEventSchedule(
    uint256 store_index,
    uint256 event_id,
    string memory month_range
  ) public returns(string memory) {
    EventStore[] storage userEventStores = calendarStore[msg.sender].eventStores;
    uint256 lengthOfEventStore = Library.getLengthOfEventStore(userEventStores);
    require(store_index <= lengthOfEventStore - 1, "Invalid store index");

    EventStore storage eventStores = userEventStores[store_index];
    EventSchedule[] storage eventSchedules = eventStores.eventSchedule[month_range];
    for (uint256 i = 0; i < eventSchedules.length; i++) {
      if (eventSchedules[i].id == event_id) {
        uint256 lastIndex = eventSchedules.length - 1;
        if (i != lastIndex) {
          EventSchedule memory temp = eventSchedules[i];
          eventSchedules[i] = eventSchedules[lastIndex];
          eventSchedules[lastIndex] = temp;
        }

        eventSchedules.pop();
        
        return "Event schedule deleted successfully";
      }
    }

    return "Event schedule not found";
  }

  function leaveParticipationEvent(
    uint256 store_index,
    string memory store_title
  ) public returns(string memory) {
    address ownerEventAccount = _getOwnerEventAccount(store_index, store_title);
    
    // remove at owner event
    _deleteParticipationAccount(store_index, ownerEventAccount);

    // remove at my participationStores
    _deleteParticipationStore(store_title, ownerEventAccount);

    return "Leave event store successfully";
  }

  function removeAccountParticipation(
    uint256 store_index,
    address participationAccount
    // string memory store_title
  ) public returns(string memory) {
    EventStore[] storage userEventStores = calendarStore[msg.sender].eventStores;
    address[] storage participationAccounts = userEventStores[store_index].eventParticipationAccounts;
    uint256 lenghtOfParticipationAccount = participationAccounts.length;
    address lastIndexAddress = participationAccounts[lenghtOfParticipationAccount - 1];
    if (participationAccount == lastIndexAddress) {
      participationAccounts.pop();
    }
    else {
      for (uint256 i = 0; i < lenghtOfParticipationAccount; i++) {
        if (participationAccounts[i] == participationAccount) {
          participationAccounts[i] = lastIndexAddress;
          participationAccounts[lenghtOfParticipationAccount - 1] = participationAccount;
          participationAccounts.pop();
          break;
        }
      }
    }

    ParticipationStore[] storage participationStores = calendarStore[participationAccount].participationStores;
    uint256 lenghtOfParticipationStores = participationStores.length;
    ParticipationStore storage lastIndexParticipationStore = participationStores[lenghtOfParticipationStores - 1];
    if (
      (lastIndexParticipationStore.store_index == store_index)
      && (lastIndexParticipationStore.createdBy == msg.sender)
    ) {
      participationStores.pop();
    }
    else {
      for (uint256 i = 0; i < lenghtOfParticipationStores; i++) {
        if (
          (participationStores[i].store_index == store_index)
          && (participationStores[i].createdBy == msg.sender)
        ) {
          participationStores[lenghtOfParticipationStores - 1] = participationStores[i];
          participationStores[i] = lastIndexParticipationStore;
          participationStores.pop();
          break;
        }
      }
    }
    
    return "Remove account participation successfully";
  }



  function deleteEventScheduleMonth(
    uint256 store_index,
    string memory month_range
  ) public returns(string memory) {
    EventStore[] storage eventStores = calendarStore[msg.sender].eventStores;
    uint256 lengthOfEventStore = eventStores.length;
    require(store_index <= lengthOfEventStore - 1, "Invalid store index");

    delete eventStores[store_index].eventSchedule[month_range];

    return "Delete all event in this month successfully";
  }
}