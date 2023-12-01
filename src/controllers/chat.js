import Chat from "../models/chat";

export const addMessage = async (req,res)=>{
    try {
        const message = await Chat.create(req.body);
        return res.status(200).json({
          status: 200,
          message: "Valid",
          body: { data: message }
      });
    } catch (error) {
      return res.status(400).json({
        status: 400,
        message: error.message,
      });
    }
}
export const updateChatRoom = async (req,res)=>{
  try {
    console.log(req.body.roomChatId);
    const chat = await Chat.findOne({roomChatId:req.body.roomChatId});
    if (!chat) {
      return res.status(404).json({
        status: 404,
        message: "chat not found",
      });
    }
    delete req.body.roomChatId;
    chat.messages.push(req.body);
    await chat.save();
    return res.status(200).json({
      status: 200,
      message: "Valid",
      body: chat
  });
  } catch (error) {
    return res.status(400).json({
      status: 400,
      message: error.message,
    });
  }
}
export const getOneChatByRoomId = async (req, res)=>{
  try {
    const chatExist = await Chat.findOne({
      roomChatId: req.params.id,
      "messages.isRead": false,
      "messages.sender": "client"
    }).populate("roomChatId");
    
    if (chatExist) {
      await Chat.updateMany(
        { roomChatId: req.params.id },
        {
          $set: {
            "messages.$[elem].isRead": true
          }
        },
        {
          arrayFilters: [{ "elem.sender": "client" }]
        }
      );
    }
    
    const chat = await Chat.findOne({ roomChatId: req.params.id }).populate("roomChatId");
    
    if (!chat) {
      return res.status(404).json({
        status: 404,
        message: "Chat not found"
      });
    }
    
    return res.status(201).json({
      body: {
        data: chat
      },
      status: 201,
      message: "get one chat successfully"
    });
  } catch (error) {
    return res.status(400).json({
      status: 400,
      message: error.message,
    });
  }
   
  }
  export const countIsRead = async (id)=>{
    try {
      const chatExsit = await Chat.findOne({roomChatId:id,"messages.isRead":false}).populate(
        "roomChatId"
      )
      if(!chatExsit){
        return 0
      }
      else{
        chatExsit
      }
    } catch (error) {
      return res.status(400).json({
        status: 404, 
      });
    }
  }
  export const updateIsReadForUser = async (req,res)=>{
    try {
      const chatExist = await Chat.findOne({
        roomChatId: req.params.id,
        "messages.isRead": false,
        "messages.sender": "admin"
      }).populate("roomChatId");
      
      if (chatExist) {
        await Chat.updateMany(
          { roomChatId: req.params.id },
          {
            $set: {
              "messages.$[elem].isRead": true
            }
          },
          {
            arrayFilters: [{ "elem.sender": "admin" }]
          }
        );
      }
          
      if (!chatExist) {
        return res.status(404).json({
          status: 404,
          message: "Chat not found"
        });
      }
      
      return res.status(201).json({
        body: {
          data: chatExist
        },
        status: 201,
        message: "get one chat successfully"
      });
    } catch (error) {
      return res.status(400).json({
        status: 400,
        message: error.message,
      });
    }
  }
  
  export const getOneChatByRoomIdForUser = async (req, res)=>{
    try {
      const chat = await Chat.findOne({roomChatId:req.params.id}).populate(
        "roomChatId"
      )

      if (!chat) {
        return res.status(404).json({
          status: 404,
          message: "Chat not found",
        });
      }
      return res.status(201).json({
        body: {
          data: chat,
        },
        status: 201,
        message: "get one chat successfully",
      });
    } catch (error) {
      return res.status(400).json({
        status: 400,
        message: error.message,
      });
    }
     
    }
  export const getAllChat = async (req, res)=>{
    try {
      const chat = await Chat.find().populate(
        "roomChatId"
      ).sort({updatedAt:-1})
      return res.status(201).json({
        body: {
          data: chat,
        },
        status: 201,
        message: "get one chat successfully",
      });
    } catch (error) {
      return res.status(400).json({
        status: 400,
        message: error.message,
      });
    }
  }
