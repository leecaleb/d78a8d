import React, { useCallback, useEffect, useState, useContext } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";
import { Grid, CssBaseline, Button } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import { SidebarContainer } from "../components/Sidebar";
import { ActiveChat } from "../components/ActiveChat";
import { SocketContext } from "../context/socket";

const useStyles = makeStyles((theme) => ({
  root: {
    height: "100vh",
  },
}));

const Home = ({ user, logout }) => {
  const history = useHistory();

  const socket = useContext(SocketContext);

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);

  const classes = useStyles();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const addSearchedUsers = (users) => {
    const currentUsers = {};

    // make table of current users so we can lookup faster
    conversations.forEach((convo) => {
      currentUsers[convo.otherUser.id] = true;
    });

    const newState = [...conversations];
    users.forEach((user) => {
      // only create a fake convo if we don't already have a convo with this user
      if (!currentUsers[user.id]) {
        let fakeConvo = { otherUser: user, messages: [] };
        newState.push(fakeConvo);
      }
    });

    setConversations(newState);
  };

  const clearSearchedUsers = () => {
    setConversations((prev) => prev.filter((convo) => convo.id));
  };

  const saveMessage = async (body) => {
    const { data } = await axios.post("/api/messages", body);
    return data;
  };

  const sendMessage = (data, body) => {
    socket.emit("new-message", {
      message: data.message,
      recipientId: body.recipientId,
      sender: data.sender,
    });
  };

  const postMessage = async(body) => {
    try {
      const data = await saveMessage(body);

      if (!body.conversationId) {
        addNewConvo(body.recipientId, data.message);
      } else {
        addMessageToConversation(data);
      }

      sendMessage(data, body);
    } catch (error) {
      console.error(error);
    }
  };

  const addNewConvo = useCallback(
    (recipientId, message) => {
      const updatedConversations = conversations.map((convo) => {
        if (convo.otherUser.id === recipientId) {
          const convoCopy = { ...convo, messages: [ ...convo.messages ] };
          convoCopy.messages.push(message);
          convoCopy.latestMessageText = message.text;
          convoCopy.id = message.conversationId;
          return convoCopy;
        } else {
          return convo;
        }
      });
      sortConversationsByMostRecent(updatedConversations)
      setConversations(updatedConversations);
    },
    [setConversations, conversations],
  );

  const addMessageToConversation = useCallback(
    (data) => {
      console.log("data: ", data)
      const senderId = data?.message?.senderId;
      // if sender isn't null, that means the message needs to be put in a brand new convo
      const { message, sender = null } = data;
      let updatedConversations = [];
      if (sender !== null) {
        const newConvo = {
          id: message.conversationId,
          otherUser: sender,
          messages: [message],
          unreadAmount: senderId === user.id ? 0 : 1
        };
        newConvo.latestMessageText = message.text;
        updatedConversations = [newConvo, ...conversations];
      } else {
        // build new conversation list
        updatedConversations = conversations.map((convo) => {
          if (convo.id === message.conversationId) {
            const convoCopy = { ...convo };
            // TODO: use otherUser to check activeConversation to decide if current user is in active chat or not
            convoCopy.messages.push(message);
            convoCopy.latestMessageText = message.text;
            convoCopy.unreadAmount += senderId === user.id ? 0 : 1;
            return convoCopy;
          } else {
            return convo;
          }
        })
      }

      sortConversationsByMostRecent(updatedConversations)
      setConversations(updatedConversations);
  }, [setConversations, conversations, user]);

  const sortConversationsByMostRecent = (convos) => {
    convos.sort((a,b) => {
      if (a.messages.length === 0 || b.messages.length === 0) return true;
      const dateA = new Date(a.messages[a.messages.length-1]?.createdAt);
      const dateB = new Date(b.messages[b.messages.length-1]?.createdAt); 
      return dateB - dateA;
    })
  }

  const setActiveChat = (username) => {
    setActiveConversation(username);
  };

  const addOnlineUser = useCallback((id) => {
    setConversations((prev) =>
      prev.map((convo) => {
        if (convo.otherUser.id === id) {
          const convoCopy = { ...convo };
          convoCopy.otherUser = { ...convoCopy.otherUser, online: true };
          return convoCopy;
        } else {
          return convo;
        }
      }),
    );
  }, []);

  const removeOfflineUser = useCallback((id) => {
    setConversations((prev) =>
      prev.map((convo) => {
        if (convo.otherUser.id === id) {
          const convoCopy = { ...convo };
          convoCopy.otherUser = { ...convoCopy.otherUser, online: false };
          return convoCopy;
        } else {
          return convo;
        }
      }),
    );
  }, []);

  const onMessageRead = async(conversationId=null, messageId=null) => {
    const { data } = await axios.put("/api/readreceipt", {
      conversationId,
      messageId
    });
    setConversations((prev) =>
      prev.map((convo) => {
        if (convo.id === conversationId) {
          const convoCopy = { ...convo };
          convoCopy.unreadAmount = data?.unreadAmount || 0
          return convoCopy;
        } else {
          return convo;
        }
      }),
    );
    notifyMessageRead(conversationId, messageId)
  }

  const setOtherUserTyping = useCallback((data) => {
    const { conversationId, typing } = data;
    setConversations((prev) => 
      prev.map((convo) => {
        if(convo.id === conversationId) {
          const convoCopy = { ...convo };
          convoCopy.otherUserTyping = typing;
          return convoCopy;
        } else {
          return convo;
        }
      })
    )
  }, []);

  const notifyTyping = (conversationId='', typing) => {
    socket.emit("typing", {
      conversationId,
      typing
    });
  }

  const setMessageRead = useCallback((data) => {
    const {conversationId, messageId } = data;
    setConversations((prev) => 
      prev.map((convo) => {
        if(convo.id === conversationId) {
          const convoCopy = { ...convo };
          convoCopy.otherUser = {
            ...convoCopy.otherUser,
            lastReadMessageId: messageId
          }
          return convoCopy;
        } else {
          return convo;
        }
      })
    )
  }, [])

  const notifyMessageRead = (conversationId='', messageId='') => {
    socket.emit("messageRead", {
      conversationId,
      messageId
    });
  }

  // Lifecycle

  useEffect(() => {
    // Socket init
    socket.on("add-online-user", addOnlineUser);
    socket.on("remove-offline-user", removeOfflineUser);
    socket.on("new-message", addMessageToConversation);
    socket.on("typing", setOtherUserTyping);
    socket.on("messageRead", setMessageRead);

    return () => {
      // before the component is destroyed
      // unbind all event handlers used in this component
      socket.off("add-online-user", addOnlineUser);
      socket.off("remove-offline-user", removeOfflineUser);
      socket.off("new-message", addMessageToConversation);
      socket.off("typing", setOtherUserTyping);
      socket.off("messageRead", setMessageRead);
    };
  }, [setOtherUserTyping, addMessageToConversation, addOnlineUser, removeOfflineUser, socket]);

  useEffect(() => {
    // when fetching, prevent redirect
    if (user?.isFetching) return;

    if (user && user.id) {
      setIsLoggedIn(true);
    } else {
      // If we were previously logged in, redirect to login instead of register
      if (isLoggedIn) history.push("/login");
      else history.push("/register");
    }
  }, [user, history, isLoggedIn]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await axios.get("/api/conversations");
        setConversations(data);
      } catch (error) {
        console.error(error);
      }
    };
    if (!user.isFetching) {
      fetchConversations();
    }
  }, [user]);

  const handleLogout = async () => {
    if (user && user.id) {
      await logout(user.id);
    }
  };

  console.log('conversations: ', conversations)

  return (
    <>
      <Button onClick={handleLogout}>Logout</Button>
      <Grid container component="main" className={classes.root}>
        <CssBaseline />
        <SidebarContainer
          conversations={conversations}
          user={user}
          clearSearchedUsers={clearSearchedUsers}
          addSearchedUsers={addSearchedUsers}
          setActiveChat={setActiveChat}
        />
        <ActiveChat
          // TODO use ws to indicate whether the other user is typing or not,
          // ActiveCHat will listen to chnages in this value
          // which will then update 
          // how do we indicate that we have read the message when we are already in this active chat?
          activeConversation={activeConversation}
          conversations={conversations}
          user={user}
          postMessage={postMessage}
          onMessageRead={onMessageRead}
          notifyTyping={notifyTyping}
        />
      </Grid>
    </>
  );
};

export default Home;
