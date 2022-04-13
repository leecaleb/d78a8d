import React from "react";
import { Box, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: 'row',
    justifyContent: "space-between",
    marginLeft: 20,
    flexGrow: 1,
    // backgroundColor: 'rgba(0,0,0,0.2)'
  },
  username: {
    fontWeight: "bold",
    letterSpacing: -0.2,
  },
  previewText: {
    fontSize: 12,
    color: "#9CADC8",
    letterSpacing: -0.17,
  },
  previewUnreadText: {
    fontSize: 12,
    color: "#000000",
    fontWeight: "bold",
    letterSpacing: -0.17,
  },
  unreadAmount: {
    // backgroundColor: 'blue',
    display: "flex",
    alignItems: 'center',
    padding: 10
  },
  unreadAmountBadge: {
    backgroundColor: "#3A8DFF",
    padding: "3px 7px",
    borderRadius: 10
  },
  unreadAmountText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: 'bold',
    textAlign: "center"
  },
  typing: {
    fontSize: 12,
    color: "#9CADC8",
    letterSpacing: -0.17,
    fontStyle: 'italic'
  }
}));

const ChatContent = ({ conversation }) => {
  const classes = useStyles();

  const { otherUser } = conversation;
  const latestMessageText = conversation.id && conversation.latestMessageText;
  const userTyping = conversation.otherUserTyping;

  // console.log('ChatContent / conversation: ', conversation)

  return (
    <Box className={classes.root}>
      <Box>
        <Typography className={classes.username}>
          {otherUser.username}
        </Typography>

        {!userTyping && <Typography className={conversation.unreadAmount > 0 ? classes.previewUnreadText : classes.previewText}>
          {latestMessageText}
        </Typography>}

        {!!userTyping && <Typography className={classes.typing}>
          {"Typing..."}
        </Typography>}
      </Box>

      {conversation.unreadAmount > 0 &&
      <Box className={classes.unreadAmount}>
        <Box className={classes.unreadAmountBadge}>
          <Typography className={classes.unreadAmountText}>
            {conversation.unreadAmount}
          </Typography>
        </Box>
      </Box>}
    </Box>
  );
};

export default ChatContent;
