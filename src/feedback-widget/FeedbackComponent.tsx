import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { BASE_URL } from "../constants";
import { FaCheck } from "react-icons/fa6";
import { IoWarningOutline } from "react-icons/io5";

import styles from "./FeedbackComponent.module.css";
import "../index.css";
import { HiOutlineArrowNarrowLeft } from "react-icons/hi";

type FeedbackComponentProps = {
  workspaceId: string;
  color: string;
  theme?: "light" | "dark";
  user?: {
    email?: string;
    name?: string;
  };
};

type Board = {
  boardId: string;
  name: string;
  description?: string;
  url: string;
  createdBy: string; // ObjectId as string
  haveAccess: string[]; // Array of ObjectIds as strings
  isDeleted: boolean;
  boardVisibility: "private" | "public";
  isStarred: boolean;
  showOnHomePage: boolean;
  postCount: number;
};

const FeedbackComponent = ({
  workspaceId,
  color,
  theme = "light",
  user,
}: FeedbackComponentProps) => {
  const [boards, setBoards] = useState<Board[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [showInputDetails, setShowInputDetails] = useState<{
    show: boolean;
    boardId: string;
    boardTitle: string;
    boardDescription: string;
  }>({
    show: false,
    boardId: "",
    boardTitle: "",
    boardDescription: "",
  });

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const { data } = await axios.post(`${BASE_URL}/sdk/fetch-boards`, {
          workspaceId,
        });
        setBoards(data.boards);
      } catch (error) {
        console.error("Error fetching boards:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, [workspaceId]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [addingPost, setAddingPost] = useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error" | "info" | "";
    content: string;
    postUrl?: string;
  }>({
    type: "",
    content: "",
  });

  const addPost = useCallback(
    async ({
      title,
      description,
      showInputDetails,
      workspaceId,
    }: {
      title: string;
      description: string;
      showInputDetails: {
        show: boolean;
        boardId: string;
        boardTitle: string;
        boardDescription: string;
      };
      workspaceId: string;
    }) => {
      try {
        if (!title) {
          setMessage({
            type: "error",
            content: "Title is required",
          });
          return;
        }

        if (!showInputDetails.boardId) {
          setMessage({
            type: "error",
            content: "Board Id is required",
          });
          return;
        }

        const postData = {
          title: title,
          content: description,
          boardId: showInputDetails.boardId,
          boardName: showInputDetails.boardTitle,
          workspaceId: workspaceId,
          user: {
            email: user?.email || "",
            name: user?.name || "",
          },
        };

        setAddingPost(true);

        const { data } = await axios.post(
          `${BASE_URL}/sdk/add-post-sdk`,
          postData
        );

        if (!data.success) {
          throw new Error(data.message);
        }

        setTitle("");
        setDescription("");
        setAddingPost(false);
        setMessage({
          type: "success",
          content: "Post added successfully",
          postUrl: data?.postUrl,
        });
      } catch (error: any) {
        setAddingPost(false);
        console.error("Error adding post:", error);
        setMessage({
          type: "error",
          content:
            error?.response?.data?.message ||
            error?.message ||
            "Error adding post, please try again",
        });
      }
    },
    [user?.email, user?.name]
  );

  const createPostComponent = () => {
    return (
      <div className={`${styles[theme]} ${styles.postContainer} `}>
        <div className={styles.header}>
          <div
            className={styles.backButton}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowInputDetails({
                show: false,
                boardId: "",
                boardTitle: "",
                boardDescription: "",
              });

              setTitle("");
              setDescription("");
              setMessage({ type: "", content: "" });
            }}
          >
            <HiOutlineArrowNarrowLeft size={20} />
          </div>
          <h3>{showInputDetails.boardTitle || "Request a feature"}</h3>
        </div>
        <input
          type="text"
          placeholder="Your post title.."
          className={styles.postInput}
          value={title}
          // autoFocus
          onChange={(e) => setTitle(e.target.value)}
          onFocus={(e) => {
            e.target.style.borderColor = color;
            setMessage({ type: "", content: "" });
          }}
          onBlur={(e) =>
            (e.target.style.borderColor =
              theme === "light" ? "#d1d5db" : "#1f2937")
          }
        />
        <textarea
          placeholder="Add a brief description.."
          className={styles.postTextArea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onFocus={(e) => {
            e.target.style.borderColor = color;
            setMessage({ type: "", content: "" });
          }}
          onBlur={(e) =>
            (e.target.style.borderColor =
              theme === "light" ? "#d1d5db" : "#1f2937")
          }
        ></textarea>
        <button
          className={styles.postButton}
          style={{
            backgroundColor: color || "#0A6847",
          }}
          disabled={addingPost}
          onClick={() =>
            addPost({
              title,
              description,
              showInputDetails,
              workspaceId,
            })
          }
        >
          {addingPost ? "Saving..." : "Submit Feedback"}
        </button>

        {/* //div for showing message */}

        {message.content && message.type && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.type === "success" ? (
              <FaCheck size={18} className={styles.messageIcon} />
            ) : (
              <IoWarningOutline className={styles.messageIcon} />
            )}
            <p>
              {message.content}{" "}
              {message.postUrl && (
                <a
                  href={`https://${message.postUrl}`}
                  className={styles.viewPost}
                  target="_blank"
                  rel="noreferrer"
                >
                  View Post
                </a>
              )}{" "}
            </p>
          </div>
        )}
      </div>
    );
  };
  return (
    <div className={`${styles[theme]} ${styles.container} animateFadeUp `}>
      {!showInputDetails.show && boards && boards?.length > 0 && (
        <>
          {boards?.map((board) => (
            <div
              key={board.boardId}
              className={styles.feedbackButton}
              onClick={() => {
                setShowInputDetails({
                  show: true,
                  boardId: board.boardId,
                  boardTitle: board.name,
                  boardDescription: board.description || "",
                });
              }}
            >
              <div className={styles.buttonContent}>
                <p className={`${styles.boardTitle}`}>{board.name}</p>
                <p className={`${styles.boardDescription}`}>
                  {board.description || "What request you got ?"}
                </p>
              </div>
            </div>
          ))}
          {/* <p
            style={{
              fontSize: "11px",
              textAlign: "center",
              fontWeight: 500,
            }}
          >
            Collect Feedback with{" "}
            <a
              href="https://feerio.com"
              target="_blank"
              rel="noreferrer"
              style={{
                color: "#0A6847",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Feerio
            </a>
          </p> */}
        </>
      )}

      {showInputDetails.show && createPostComponent()}

      {!loading && !boards?.length && (
        <h3
          style={{
            textAlign: "center",
            fontSize: "12px",
            fontWeight: 400,
          }}
        >
          No feedback boards found!
        </h3>
      )}

      {loading && (
        <p
          style={{
            textAlign: "center",
            fontSize: "12px",
            fontWeight: 400,
          }}
        >
          Loading...
        </p>
      )}
    </div>
  );
};

export default FeedbackComponent;
