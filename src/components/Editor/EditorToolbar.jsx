const runCode = async () => {

  try {

    const res = await api.post("/code/run", {
      code,
      language
    });

    setOutput(res.data.output);

  } catch (err) {

    setError(err.response.data.error);

  }

};