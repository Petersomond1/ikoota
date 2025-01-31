import React, { useState } from 'react';
import './listcomments.css';

const ListComments = ({ teachings, chats, comments }) => {
    const [addMode, setAddMode] = useState(false);

    const getCommentsForItem = (itemId, itemType) => {
        return comments.filter(comment => comment[itemType + '_id'] === itemId);
    };

    return (
        <div className='listcomments_container'>
            <div className="search">
                <div className="searchbar">
                    <img src="./search.png" alt="" />
                    <input type="text" placeholder="Search" />
                </div>
                <img src={addMode ? "./minus.png" : "./plus.png"} alt="" className='add' onClick={() => setAddMode(!addMode)} />
            </div>
            {(!chats?.length && !teachings?.length) && <p>No teachings nor chats</p>}
            {teachings?.map((teaching) => (
                <div key={teaching.id} className="item">
                    <div className="texts">
                        <span>Topic: {teaching.topic}</span>
                        {getCommentsForItem(teaching.id, 'teaching').length === 0 && <p>No comments</p>}
                        {getCommentsForItem(teaching.id, 'teaching').map((comment) => (
                            <div key={comment.id} className="item">
                                <img src="./avatar.png" alt="" />
                                <div className="texts">
                                    <span>{comment.author}</span>
                                    <p>{comment.comment}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            {chats?.map((chat) => (
                <div key={chat.id} className="item">
                    <div className="texts">
                        <span>Topic: {chat.topic}</span>
                        {getCommentsForItem(chat.id, 'chat').length === 0 && <p>No comments</p>}
                        {getCommentsForItem(chat.id, 'chat').map((comment) => (
                            <div key={comment.id} className="item">
                                <img src="./avatar.png" alt="" />
                                <div className="texts">
                                    <span>{comment.author}</span>
                                    <p>{comment.comment}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ListComments;
