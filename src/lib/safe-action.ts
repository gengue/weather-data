import {
  createSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE,
} from "next-safe-action";
import { ParserError } from "./errors";

export const actionClient = createSafeActionClient({
  handleReturnedServerError(e) {
    if (e instanceof ParserError) {
      return e.message;
    }

    // Every other error that occurs will be masked with the default message.
    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
});
