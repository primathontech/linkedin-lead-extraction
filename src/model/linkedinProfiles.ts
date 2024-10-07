// import mongoose from 'mongoose'
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

interface LinkedInProfile {
    firstName: string;
    lastName: string;
    fullName: string;
    geoRegion: string;
    currentPosition: string;
    companyName: string;
    tenureAtCompany: string; // This could be a string representing tenure duration
    startedOn: Date; // Date when started at the current company
    title: string;
    tenureAtPosition: string; // Tenure in the current position
    companyIndustry: string;
    companyLocation: string;
    companyUrl: string;
    profileUrl: string;
}


const LinkedInProfileSchema = new Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    fullName: { type: String, required: true },
    geoRegion: { type: String },
    currentPosition: { type: String },
    companyName: { type: String },
    tenureAtCompany: { type: String }, // You can use String to represent duration
    startedOn: { type: Date },
    title: { type: String },
    tenureAtPosition: { type: String },
    companyIndustry: { type: String },
    companyLocation: { type: String },
    companyUrl: { type: String },
    profileUrl: { type: String, required: true }
});

const LinkedInProfileModel = mongoose.model('LinkedInProfileModel', LinkedInProfileSchema);

// module.exports = LinkedInProfileModel;
export default LinkedInProfileModel;


