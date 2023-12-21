// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "../Calendar.sol";

library Library {
  function compareString(string memory a, string memory b) public pure returns(bool) {
    return keccak256(abi.encodePacked(a))  == keccak256(abi.encodePacked(b));
  }

  function getLengthOfEventStore(Calendar.EventStore[] storage eventStores) public view returns(uint256) {
    return eventStores.length;
  }

  function getLengthOfEventSchedule(Calendar.EventSchedule[] storage eventSchedules) public view returns(uint256) {
    return eventSchedules.length;
  }

  function getLengthOfString(string memory str) public pure returns (uint256) {
    bytes memory stringBytes = bytes(str);
    return stringBytes.length;
  }

  function checkOverlapEventTimeline(
    uint256 lengthOfEventSchedule,
    uint256 start_event,
    uint256 end_event,
    Calendar.EventSchedule[] storage userEventSchedules
  ) public view returns(bool) {
    bool validEventTimeLine = true;

    for (uint256 i = 0; i < lengthOfEventSchedule; i++) {
      uint256 startEventSchedule = userEventSchedules[i].start_event;
      uint256 endEventSchedule = userEventSchedules[i].end_event;
      validEventTimeLine = !(
           (startEventSchedule <  start_event && endEventSchedule >  end_event)
        || (startEventSchedule >  start_event && endEventSchedule <  end_event)
        || (startEventSchedule == start_event && endEventSchedule == end_event)
        || (startEventSchedule <  start_event && endEventSchedule == end_event)
        || (startEventSchedule >  start_event && endEventSchedule == end_event)
        || (startEventSchedule == start_event && endEventSchedule <  end_event)
        || (startEventSchedule == start_event && endEventSchedule >  end_event)
        || 
          (
            (startEventSchedule < start_event && endEventSchedule > start_event) 
            && endEventSchedule < end_event
          )
        || 
          (
            (startEventSchedule < end_event && endEventSchedule > end_event) 
            && startEventSchedule > start_event
          )
      );
    }

    return validEventTimeLine;
  }
}

    // it('Should revert leave participation invalid store index', async () => {
    //   const store_index = 0;
    //   await ct.connect(user1).createEventStore(titleGroup1OfEventStore);
    //   await ct.connect(user1).addEventStore(
    //     1,
    //     10,
    //     20,
    //     store_index,
    //     titleGroup1OfEventStore,
    //     title1EventSchedule,
    //     month_range
    //   );

    //   const invitation_account = await user2.getAddress();
    //   await ct.connect(user1).inviteParticipation(
    //     store_index,
    //     titleGroup1OfEventStore,
    //     invitation_account
    //   );

    //   await expect(
    //     ct.connect(user2).leaveParticipationEvent(
    //       1, 
    //       titleGroup1OfEventStore
    //     )
    //   ).to.be.revertedWith('Invalid store index');



    //   // LEAVE
    //   // await ct.connect(user2).leaveParticipationEvent(1, titleGroup1OfEventStore);
    // });