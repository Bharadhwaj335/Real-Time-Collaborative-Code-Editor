import { executeCodeRemotely } from "../Services/codeExecution.service.js";

export const executeCode = async (req, res, next) => {
  try {
    const code = req.body?.code;
    const language = req.body?.language;

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        message: "code and language are required",
      });
    }

    const result = await executeCodeRemotely({
      code,
      language,
      stdin: req.body?.stdin || "",
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    return next(err);
  }
};
