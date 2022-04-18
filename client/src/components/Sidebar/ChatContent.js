import React from "react";
import { Box, Typography, Badge } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: 'row',
    justifyContent: "space-between",
    marginLeft: 20,
    flexGrow: 1,
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
    display: "flex",
    alignItems: 'center',
    padding: 10
  },
}));

const ChatContent = ({ conversation }) => {
  const classes = useStyles();

  const { otherUser } = conversation;
  const latestMessageText = conversation.id && conversation.latestMessageText;

  return (
    <Box className={classes.root}>
      <Box>
        <Typography className={classes.username}>
          {otherUser.username}
        </Typography>

        <Typography
          data-cy={"previewUnreadText"}
          className={conversation.unreadAmount > 0 ? classes.previewUnreadText : classes.previewText}
        >
          {latestMessageText}
        </Typography>
      </Box>

      {conversation.unreadAmount > 0 &&
      <Box className={classes.unreadAmount}>
        <Badge badgeContent={conversation.unreadAmount} color="primary" />
      </Box>}
    </Box>
  );
};

export default ChatContent;
