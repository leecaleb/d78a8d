import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Box } from '@material-ui/core';
import { SenderBubble, OtherUserBubble } from '.';
import moment from 'moment';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';

const useStyles = makeStyles((theme) => ({
  ellipsis: {
    color: '#FFFFFF',
    opacity: 0.5,
    margin: "-12px 0"
  },
}));

const Messages = (props) => {
  const { messages, otherUser, userId, otherUserTyping } = props;
  const classes = useStyles();

  return (
    <Box>
      {messages.map((message) => {
        const time = moment(message.createdAt).format('h:mm');

        return message.senderId === userId ? (
          <SenderBubble
            key={message.id}
            messageId={message.id}
            text={message.text}
            time={time}
            otherUser={otherUser}
            />
        ) : (
          <OtherUserBubble
            key={message.id}
            text={message.text}
            time={time}
            otherUser={otherUser}
          />
        );
      })}
      {!!otherUserTyping && (
        <OtherUserBubble
          key={0}
          text={
            <MoreHorizIcon fontSize="large" classes={{ root: classes.ellipsis }} />
          }
          time={null}
          otherUser={otherUser}
        />
      )}
    </Box>
  );
};

export default Messages;
