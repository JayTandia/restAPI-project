import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import type { User } from "./userTypes.js";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;

  // validation
  if (!name || !email || !password) {
    const error = createHttpError(400, "All fields are required");
    return next(error);
  }

  try {
    // db call
    const user = await userModel.findOne({ email });
    if (user) {
      const error = createHttpError(400, "Email registered already");
      return next(error);
    }
  } catch (error) {
    return next(createHttpError(500, "Error while getting user"));
  }

  // pasword -> hash
  const hashedPassword = await bcrypt.hash(password, 10);

  let newUser: User;

  try {
    newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });
  } catch (error) {
    return next(createHttpError(500, "Error while creating user"));
  }

  try {
    // token gen JWT
    const token = jwt.sign({ sub: newUser._id }, config.jwtSecret as string, {
      expiresIn: "7d",
    });

    // response
    res.status(201).json({
      accessToken: token,
    });
  } catch (error) {
    return next(createHttpError(500, "Error while signing the jwt token"));
  }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if(!email || !password){
        return next(createHttpError(400, "All fields are required"))
    }

    const user = await userModel.findOne({email})

    if(!user){
        return next(createHttpError(404, "User not found"))
    } 

    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch){
        return next(createHttpError(400, "Username or password incorrect"))
    }

    // create access token
    const token = jwt.sign({sub: user._id}, config.jwtSecret as string, {expiresIn: '7d'})

    res.json({
        accessToken: token
    })
}

export { createUser, loginUser };
